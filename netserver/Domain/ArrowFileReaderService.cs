namespace netserver.Domain
{
    public sealed class ArrowFileReaderService
    {
        public FileStream ReadFileAsync(string fileName)
        {
            string arrowFilePath = Path.Combine(Directory.GetCurrentDirectory(), "static_files", fileName);

            // Read the Arrow file
            return new FileStream(arrowFilePath, FileMode.Open, FileAccess.Read);
        }
    }
}