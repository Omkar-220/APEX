using Domain.ValueObjects;
using FluentAssertions;

namespace Domain.Tests.ValueObjects;

public class EmailTests
{
    [Fact]
    public void Create_ValidEmail_Succeeds()
    {
        var email = Email.Create("Test@Example.COM");
        email.Value.Should().Be("test@example.com");
    }

    [Fact]
    public void Create_NormalizesToLowercase()
    {
        var email = Email.Create("USER@DOMAIN.COM");
        email.Value.Should().Be("user@domain.com");
    }

    [Fact]
    public void Create_TrimsWhitespace()
    {
        var email = Email.Create("  user@domain.com  ");
        email.Value.Should().Be("user@domain.com");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_EmptyOrWhitespace_ThrowsArgumentException(string input)
    {
        Action act = () => Email.Create(input);
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    [InlineData("@nodomain")]
    [InlineData("no-at-sign")]
    public void Create_InvalidFormat_ThrowsArgumentException(string input)
    {
        Action act = () => Email.Create(input);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_TooLong_ThrowsArgumentException()
    {
        var longEmail = new string('a', 250) + "@b.com";
        Action act = () => Email.Create(longEmail);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equality_SameValue_AreEqual()
    {
        var e1 = Email.Create("user@domain.com");
        var e2 = Email.Create("USER@DOMAIN.COM");
        e1.Should().Be(e2);
    }

    [Fact]
    public void Equality_DifferentValues_AreNotEqual()
    {
        var e1 = Email.Create("user1@domain.com");
        var e2 = Email.Create("user2@domain.com");
        e1.Should().NotBe(e2);
    }

    [Fact]
    public void ImplicitConversion_ToString_ReturnsValue()
    {
        var email = Email.Create("user@domain.com");
        string value = email;
        value.Should().Be("user@domain.com");
    }
}

public class AzureAdOidTests
{
    [Fact]
    public void Create_ValidOid_Succeeds()
    {
        var oid = AzureAdOid.Create("abc-123-def");
        oid.Value.Should().Be("abc-123-def");
    }

    [Fact]
    public void Create_TrimsWhitespace()
    {
        var oid = AzureAdOid.Create("  abc-123  ");
        oid.Value.Should().Be("abc-123");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_EmptyOrWhitespace_ThrowsArgumentException(string input)
    {
        Action act = () => AzureAdOid.Create(input);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_TooLong_ThrowsArgumentException()
    {
        var longOid = new string('a', 129);
        Action act = () => AzureAdOid.Create(longOid);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equality_SameValue_AreEqual()
    {
        var o1 = AzureAdOid.Create("same-oid");
        var o2 = AzureAdOid.Create("same-oid");
        o1.Should().Be(o2);
    }

    [Fact]
    public void Equality_DifferentValues_AreNotEqual()
    {
        var o1 = AzureAdOid.Create("oid-1");
        var o2 = AzureAdOid.Create("oid-2");
        o1.Should().NotBe(o2);
    }
}

public class DisplayNameTests
{
    [Fact]
    public void Create_ValidName_Succeeds()
    {
        var name = DisplayName.Create("John Doe");
        name.Value.Should().Be("John Doe");
    }

    [Fact]
    public void Create_TrimsWhitespace()
    {
        var name = DisplayName.Create("  John Doe  ");
        name.Value.Should().Be("John Doe");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_EmptyOrWhitespace_ThrowsArgumentException(string input)
    {
        Action act = () => DisplayName.Create(input);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_TooLong_ThrowsArgumentException()
    {
        var longName = new string('a', 256);
        Action act = () => DisplayName.Create(longName);
        act.Should().Throw<ArgumentException>();
    }
}

public class OptionMappingTests
{
    private static Dictionary<char, char> ValidMapping() => new()
    {
        ['A'] = 'C', ['B'] = 'A', ['C'] = 'D', ['D'] = 'B'
    };

    [Fact]
    public void Create_ValidMapping_Succeeds()
    {
        var mapping = OptionMapping.Create(ValidMapping());
        mapping.Should().NotBeNull();
    }

    [Fact]
    public void Create_MissingKey_ThrowsArgumentException()
    {
        var invalid = new Dictionary<char, char>
        {
            ['A'] = 'C', ['B'] = 'A', ['C'] = 'D'
        };
        Action act = () => OptionMapping.Create(invalid);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_DuplicateValues_ThrowsArgumentException()
    {
        var invalid = new Dictionary<char, char>
        {
            ['A'] = 'C', ['B'] = 'C', ['C'] = 'D', ['D'] = 'B'
        };
        Action act = () => OptionMapping.Create(invalid);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_NullMapping_ThrowsArgumentException()
    {
        Action act = () => OptionMapping.Create(null!);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void GetOriginalOption_ReturnsCorrectOriginal()
    {
        var mapping = OptionMapping.Create(ValidMapping());
        mapping.GetOriginalOption('A').Should().Be('C');
        mapping.GetOriginalOption('B').Should().Be('A');
        mapping.GetOriginalOption('C').Should().Be('D');
        mapping.GetOriginalOption('D').Should().Be('B');
    }

    [Fact]
    public void GetDisplayOption_ReturnsCorrectDisplay()
    {
        var mapping = OptionMapping.Create(ValidMapping());
        mapping.GetDisplayOption('C').Should().Be('A'); // original C is displayed as A
        mapping.GetDisplayOption('A').Should().Be('B'); // original A is displayed as B
    }

    [Fact]
    public void GetOriginalOption_InvalidKey_ThrowsArgumentException()
    {
        var mapping = OptionMapping.Create(ValidMapping());
        Action act = () => mapping.GetOriginalOption('E');
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ToJson_AndFromJson_RoundTrip()
    {
        var original = OptionMapping.Create(ValidMapping());
        var json = original.ToJson();
        var restored = OptionMapping.FromJson(json);
        restored.Should().Be(original);
    }

    [Fact]
    public void FromJson_InvalidJson_ThrowsArgumentException()
    {
        Action act = () => OptionMapping.FromJson("not-valid-json");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equality_SameMappings_AreEqual()
    {
        var m1 = OptionMapping.Create(ValidMapping());
        var m2 = OptionMapping.Create(ValidMapping());
        m1.Should().Be(m2);
    }

    [Fact]
    public void Equality_DifferentMappings_AreNotEqual()
    {
        var m1 = OptionMapping.Create(ValidMapping());
        var m2 = OptionMapping.Create(new Dictionary<char, char>
        {
            ['A'] = 'A', ['B'] = 'B', ['C'] = 'C', ['D'] = 'D'
        });
        m1.Should().NotBe(m2);
    }
}
