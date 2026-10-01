namespace Advantis.BankCockpit.Api.Model
{
    public class AppConfig_Model
    {
        public int App_Config_Mkey { get; set; }
        public string? ConnectionString { get; set; }
        public string? Issuer { get; set; }
        public string? Audience { get; set; }
        public string? SecretKey { get; set; }
        public string? EncryptionKey { get; set; }
        public string? Environment_key { get; set; }

        public string? Attribute1 { get; set; }
        public string? Attribute2 { get; set; }
        public string? Attribute3 { get; set; }
        public string? Attribute4 { get; set; }
        public string? Attribute5 { get; set; }

        public int? Created_By { get; set; }
        public DateTime? Creation_Date { get; set; }

        public int? Last_UpdatedBY { get; set; }
        public DateTime? Last_UpdateDate { get; set; }

        public string? Delete_Flag { get; set; }
    }
}
