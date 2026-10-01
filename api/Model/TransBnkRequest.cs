namespace Advantis.BankCockpit.Api.Model
{
    public class TransBnkRequest
    {
        public string? BankCode { get; set; }
        public string? EntityId { get; set; }
        public string? ProgramId { get; set; }
        public string? CustomerId { get; set; }
        public string? AccountNumber { get; set; }
        public string? FromDateTime { get; set; }
        public string? ToDateTime { get; set; }
        //public string? CustomerRequestId { get; set; }
    }

    public class TransBnkTransactionResponse
    {
        public string? TransactionId { get; set; }
        public string? TransactionDate { get; set; }
        public string? ValueDate { get; set; }
        public string? TransactionType { get; set; }
        public string? Remarks { get; set; }
        public string? TransactionReferenceNumber { get; set; }
        public string? TransactionMode { get; set; }
        public decimal? TransactionAmount { get; set; }
        public decimal? RunningBalance { get; set; }
        public string? UtrNumber { get; set; }
        public string? RemitterName { get; set; }
        public string? RemitterAccountNo { get; set; }
        public string? RemitterIfsc { get; set; }
        public string? RemitterBankName { get; set; }
        public string? RemitterBranch { get; set; }

    }

    public class TransBnkStatement_Model
    {
        public int? Mkey { get; set; }
        public string? BankCode { get; set; }
        public string? EntityId { get; set; }
        public string? ProgramId { get; set; }
        public string? CustomerId { get; set; }
        public string? AccountNumber { get; set; }
        public string? FromDateTime { get; set; }
        public string? ToDateTime { get; set; }
        //  TransBnk TransactionResponse Table 
        public string? TransactionId { get; set; }
        public string? TransactionDate { get; set; }
        public string? ValueDate { get; set; }
        public string? TransactionType { get; set; }
        public string? Remarks { get; set; }
        public string? TransactionReferenceNumber { get; set; }
        public string? TransactionMode { get; set; }
        public decimal? TransactionAmount { get; set; }
        public decimal? RunningBalance { get; set; }
        public string? UtrNumber { get; set; }
        public string? RemitterName { get; set; }
        public string? RemitterAccountNo { get; set; }
        public string? RemitterIfsc { get; set; }
        public string? RemitterBankName { get; set; }
        public string? RemitterBranch { get; set; }
        public string? JsonContent { get; set; }
        public string? ResponseJsonContent { get; set; }

        public string? Delete_Flag { get; set; }
        public int? Created_By { get; set; }
        public DateTime? Creation_Date { get; set; }
        public int? LastUpdate_By { get; set; }
        public DateTime? LastUpdate_Date { get; set; }

    }
}
