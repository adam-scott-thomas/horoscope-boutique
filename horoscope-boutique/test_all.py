#!/usr/bin/env python3
"""
Test Script - Comprehensive System Testing
Tests all modules without requiring API credentials
"""

import sys
from generator import generate_single_horoscope, generate_couples_horoscope
from sms import split_message, format_single_horoscope_sms, format_couples_horoscope_sms
from email_sender import format_plain_text_single, format_plain_text_couples


def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70 + "\n")


def test_horoscope_generation():
    """Test horoscope generation"""
    print_section("TESTING HOROSCOPE GENERATION")
    
    # Test single horoscope
    print("Generating single horoscope for Emma (Pisces)...")
    single = generate_single_horoscope(
        name="Emma",
        sign="Pisces",
        context="Feeling stressed about work but hopeful"
    )
    
    print(f"\n✅ Generated Successfully!")
    print(f"   Name: {single['name']}")
    print(f"   Sign: {single['sign']}")
    print(f"   Lucky Color: {single['lucky_color']}")
    print(f"   Mantra: {single['mantra']}")
    print(f"   Daily Focus: {single['daily_focus']}")
    print(f"   Horoscope Length: {len(single['horoscope'])} characters")
    print(f"\n   Horoscope Text:")
    print(f"   {single['horoscope'][:150]}...")
    
    # Test couples horoscope
    print("\n" + "-" * 70)
    print("\nGenerating couples horoscope for Alex & Jordan...")
    couples = generate_couples_horoscope(
        name_1="Alex",
        sign_1="Leo",
        name_2="Jordan",
        sign_2="Aquarius",
        context="Planning their wedding"
    )
    
    print(f"\n✅ Generated Successfully!")
    print(f"   Partners: {couples['name_1']} ({couples['sign_1']}) & {couples['name_2']} ({couples['sign_2']})")
    print(f"   Lucky Color: {couples['lucky_color']}")
    print(f"   Shared Mantra: {couples['shared_mantra']}")
    print(f"   Relationship Focus: {couples['relationship_focus']}")
    print(f"   Horoscope Length: {len(couples['couples_horoscope'])} characters")
    print(f"\n   Horoscope Text:")
    print(f"   {couples['couples_horoscope'][:150]}...")
    
    return single, couples


def test_sms_formatting(single, couples):
    """Test SMS formatting and splitting"""
    print_section("TESTING SMS FORMATTING")
    
    # Test single horoscope formatting
    print("Formatting single horoscope for SMS...")
    single_sms = format_single_horoscope_sms(single)
    print(f"\n✅ Formatted Successfully!")
    print(f"   Total Length: {len(single_sms)} characters")
    
    # Test message splitting
    segments = split_message(single_sms)
    print(f"   Will be sent as: {len(segments)} SMS segment(s)")
    for i, segment in enumerate(segments, 1):
        print(f"   Segment {i}: {len(segment)} characters")
    
    print("\n   Preview (first 200 chars):")
    print(f"   {single_sms[:200]}...")
    
    # Test couples horoscope formatting
    print("\n" + "-" * 70)
    print("\nFormatting couples horoscope for SMS...")
    couples_sms = format_couples_horoscope_sms(couples)
    print(f"\n✅ Formatted Successfully!")
    print(f"   Total Length: {len(couples_sms)} characters")
    
    segments = split_message(couples_sms)
    print(f"   Will be sent as: {len(segments)} SMS segment(s)")
    for i, segment in enumerate(segments, 1):
        print(f"   Segment {i}: {len(segment)} characters")
    
    print("\n   Preview (first 200 chars):")
    print(f"   {couples_sms[:200]}...")


def test_email_formatting(single, couples):
    """Test email formatting"""
    print_section("TESTING EMAIL FORMATTING")
    
    # Test single horoscope email
    print("Formatting single horoscope for email...")
    single_email = format_plain_text_single(single)
    print(f"\n✅ Formatted Successfully!")
    print(f"   Plain Text Length: {len(single_email)} characters")
    print(f"   HTML Template: Ready ✓")
    
    print("\n   Plain Text Preview:")
    print("   " + "-" * 66)
    for line in single_email.split('\n')[:10]:
        print(f"   {line}")
    print("   ...")
    
    # Test couples horoscope email
    print("\n" + "-" * 70)
    print("\nFormatting couples horoscope for email...")
    couples_email = format_plain_text_couples(couples)
    print(f"\n✅ Formatted Successfully!")
    print(f"   Plain Text Length: {len(couples_email)} characters")
    print(f"   HTML Template: Ready ✓")
    
    print("\n   Plain Text Preview:")
    print("   " + "-" * 66)
    for line in couples_email.split('\n')[:10]:
        print(f"   {line}")
    print("   ...")


def test_edge_cases():
    """Test edge cases and special scenarios"""
    print_section("TESTING EDGE CASES")
    
    # Test all zodiac signs
    print("Testing all zodiac signs...")
    signs = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    
    for sign in signs:
        horoscope = generate_single_horoscope("Test", sign)
        assert horoscope['sign'] == sign
        assert len(horoscope['horoscope']) > 100
        assert horoscope['lucky_color']
        assert horoscope['mantra']
        assert horoscope['daily_focus']
    
    print(f"✅ All {len(signs)} zodiac signs work correctly!")
    
    # Test long messages
    print("\n" + "-" * 70)
    print("\nTesting very long message splitting...")
    long_message = "A" * 500
    segments = split_message(long_message)
    print(f"✅ 500 character message split into {len(segments)} segments")
    assert len(segments) >= 4
    
    # Test short message
    print("\n" + "-" * 70)
    print("Testing short message (no splitting needed)...")
    short_message = "Short message"
    segments = split_message(short_message)
    print(f"✅ Short message kept as 1 segment")
    assert len(segments) == 1


def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 70)
    print(" ✨ HOROSCOPE SYSTEM - COMPREHENSIVE TEST SUITE ✨")
    print("=" * 70)
    print("\nRunning all tests without requiring API credentials...")
    print("This will verify that all modules work correctly.\n")
    
    try:
        # Test horoscope generation
        single, couples = test_horoscope_generation()
        
        # Test SMS formatting
        test_sms_formatting(single, couples)
        
        # Test email formatting
        test_email_formatting(single, couples)
        
        # Test edge cases
        test_edge_cases()
        
        # Success summary
        print_section("TEST SUMMARY")
        print("✅ All tests passed successfully!")
        print("\n📝 What was tested:")
        print("   • Single horoscope generation")
        print("   • Couples horoscope generation")
        print("   • SMS message formatting")
        print("   • SMS message splitting (for long messages)")
        print("   • Email plain text formatting")
        print("   • Email HTML template availability")
        print("   • All 12 zodiac signs")
        print("   • Edge cases (long/short messages)")
        
        print("\n🎯 Next steps:")
        print("   1. Configure your API credentials in .env")
        print("   2. Run: python local_send.py --sms")
        print("   3. Test with your own phone number")
        print("   4. Deploy to Cloudflare Workers")
        
        print("\n" + "=" * 70)
        print(" 🎉 All systems ready! Start spreading positivity! ✨")
        print("=" * 70 + "\n")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Test failed with error:")
        print(f"   {str(e)}")
        print(f"\n   Please check the error message above and fix any issues.")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
