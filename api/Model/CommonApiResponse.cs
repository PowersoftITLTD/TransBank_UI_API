namespace Advantis.BankCockpit.Api.Model
{
    public class CommonApiResponse<T>
    {

        public string? customerRequestId { get; set; }
        public string? status { get; set; }
        public string? message { get; set; }
        public T? data { get; set; }
    }

    public class CommonObjResponse
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }
    }

    public class CommonAppConfig<T> 
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }
    public class TransBnkConfigModel
    {
        public int Mkey { get; set; }
        public string? Api_Key { get; set; }
        public string? BaseUrl { get; set; }
        public string? Delete_Flag { get; set; }
        public decimal? Created_By { get; set; }
        public DateTime? Creation_Date { get; set; }
        public decimal? LastUpdate_By { get; set; }
        public DateTime? LastUpdate_Date { get; set; }
    }
}
