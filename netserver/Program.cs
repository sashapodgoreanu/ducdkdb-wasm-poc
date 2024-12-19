using System.Text.Json;
using Parquet.Data;
using Parquet.Extensions;
using Parquet.Schema;
using Parquet;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Endpoint to read Parquet files and return JSON
app.MapGet("/api/read/{filename}", async (string filename) =>
{
  string filePath = Path.Combine(Directory.GetCurrentDirectory(), "static_files", filename);

  // Check if the file exists
  if (!File.Exists(filePath))
  {
    return Results.NotFound(new { message = "File not found." });
  }

  try
  {
    // Open and read the Parquet file
    using var stream = File.OpenRead(filePath);
    var parquetOptions = new ParquetOptions { TreatByteArrayAsString = true };
    using ParquetReader parquetReader = await ParquetReader.CreateAsync(stream, parquetOptions);

    var dataset = new List<Dictionary<string, object>>();

    // Read all row groups
    for (int i = 0; i < parquetReader.RowGroupCount; i++)
    {
      using var groupReader = parquetReader.OpenRowGroupReader(i);
      foreach (var field in parquetReader.Schema.Fields)
      {
        // Read column data
        var column = await groupReader.ReadColumnAsync((DataField)field);
        var values = column.Data;

        // Map the data to a JSON-compatible format
        for (int j = 0; j < values.Length; j++)
        {
          if (dataset.Count <= j)
          {
            dataset.Add(new Dictionary<string, object>());
          }
          dataset[j][field.Name] = values.GetValue(j);
        }
      }
    }

    // Serialize the dataset to JSON
    var json = JsonSerializer.Serialize(dataset, new JsonSerializerOptions
    {
      WriteIndented = true
    });

    return Results.Text(json, "application/json");
  }
  catch (Exception ex)
  {
    return Results.Problem($"Error reading Parquet file: {ex.Message}");
  }
});

app.MapGet("/", () => "Use /read/{filename} to read a Parquet file and get its content in JSON.");

app.Run();
