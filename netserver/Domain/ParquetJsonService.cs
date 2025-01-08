using System.Text.Json;
using Parquet.Data;
using Parquet.Extensions;
using Parquet.Schema;
using Parquet;

namespace netserver.Domain;

public sealed class ParquetJsonService
{
    public async Task<List<Dictionary<string, object>>> GetDataAsync(string filename, int? limit = 1000)
    {
        string filePath = Path.Combine(Directory.GetCurrentDirectory(), "static_files", filename);

        // Check if the file exists
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        using var stream = File.OpenRead(filePath);
        var parquetOptions = new ParquetOptions { TreatByteArrayAsString = true };
        using var parquetReader = await ParquetReader.CreateAsync(stream, parquetOptions);

        var dataset = new List<Dictionary<string, object>>();
        int maxRows = limit ?? int.MaxValue;

        // Read all row groups
        for (int i = 0; i < parquetReader.RowGroupCount && dataset.Count < maxRows; i++)
        {
            using var groupReader = parquetReader.OpenRowGroupReader(i);

            var fields = parquetReader.Schema.Fields.OfType<DataField>().ToList();
            var columnData = new Dictionary<string, Array>();

            // Read all columns in the row group
            foreach (var field in fields)
            {
                var column = await groupReader.ReadColumnAsync(field);
                columnData[field.Name] = column.Data;
            }

            // Map data to JSON-compatible format in batches
            int rowsInGroup = columnData.Values.First().Length; // Assume all columns have the same number of rows
            int rowsToProcess = Math.Min(rowsInGroup, maxRows - dataset.Count);

            for (int j = 0; j < rowsToProcess; j++)
            {
                var row = new Dictionary<string, object>();
                foreach (var field in fields)
                {
                    row[field.Name] = columnData[field.Name].GetValue(j);
                }
                dataset.Add(row);
            }
        }

        return dataset;
    }
}
