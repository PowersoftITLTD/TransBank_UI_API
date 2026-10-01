using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace Advantis.BankCockpit.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection Create();
}

public sealed class SqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("BankCockpit")
            ?? throw new InvalidOperationException(
                "Connection string 'BankCockpit' is missing. Set it in appsettings.json or as " +
                "ConnectionStrings__BankCockpit in the environment.");
    }

    public IDbConnection Create() => new SqlConnection(_connectionString);
}

/// <summary>
/// Dapper does not map <see cref="DateOnly"/> out of the box on .NET 8.
/// LastRecoDate and ValueDate are calendar dates, not instants — storing them
/// as DateTime invites a timezone shift that moves a reconciliation date across
/// a month end.
/// </summary>
public sealed class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override DateOnly Parse(object value) => DateOnly.FromDateTime((DateTime)value);

    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value.ToDateTime(TimeOnly.MinValue);
    }
}

public sealed class NullableDateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly?>
{
    public override DateOnly? Parse(object value) =>
        value is DateTime dt ? DateOnly.FromDateTime(dt) : null;

    public override void SetValue(IDbDataParameter parameter, DateOnly? value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value?.ToDateTime(TimeOnly.MinValue) ?? (object)DBNull.Value;
    }
}
