"""
SMS Module - VoIP.ms Integration
Sends SMS messages via VoIP.ms REST API with message splitting support
"""

import requests
import logging
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlencode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# VoIP.ms API Configuration
VOIPMS_API_URL = "https://voip.ms/api/v1/rest.php"
SMS_MAX_LENGTH = 160  # Standard SMS segment length


class VoIPMSError(Exception):
    """Custom exception for VoIP.ms API errors"""
    pass


def split_message(message: str, max_length: int = SMS_MAX_LENGTH) -> List[str]:
    """
    Split a long message into SMS-sized segments.
    
    Args:
        message: The full message text
        max_length: Maximum length per segment (default 160)
    
    Returns:
        List of message segments
    """
    if len(message) <= max_length:
        return [message]
    
    segments = []
    words = message.split()
    current_segment = ""
    
    for word in words:
        # Check if adding this word would exceed the limit
        test_segment = current_segment + (" " if current_segment else "") + word
        
        if len(test_segment) <= max_length:
            current_segment = test_segment
        else:
            # Save current segment and start new one
            if current_segment:
                segments.append(current_segment)
            current_segment = word
            
            # If a single word is longer than max_length, split it
            while len(current_segment) > max_length:
                segments.append(current_segment[:max_length])
                current_segment = current_segment[max_length:]
    
    # Add the last segment
    if current_segment:
        segments.append(current_segment)
    
    return segments


def send_sms_voipms(
    api_username: str,
    api_password: str,
    did: str,
    dst: str,
    message: str,
    split_long_messages: bool = True
) -> Dict:
    """
    Send SMS via VoIP.ms API.
    
    Args:
        api_username: VoIP.ms API username (usually your email)
        api_password: VoIP.ms API password
        did: Sender phone number (your VoIP.ms DID)
        dst: Destination phone number
        message: Message content
        split_long_messages: If True, automatically split long messages
    
    Returns:
        Dict with status and response details
    """
    try:
        # Clean phone numbers (remove non-digits)
        did = ''.join(filter(str.isdigit, did))
        dst = ''.join(filter(str.isdigit, dst))
        
        # Validate phone numbers
        if len(did) < 10 or len(dst) < 10:
            raise VoIPMSError("Invalid phone number format. Must be at least 10 digits.")
        
        # Split message if needed
        if split_long_messages:
            segments = split_message(message)
            logger.info(f"Message split into {len(segments)} segment(s)")
        else:
            segments = [message]
        
        results = []
        
        for i, segment in enumerate(segments, 1):
            # Add segment indicator for multi-part messages
            if len(segments) > 1:
                segment_msg = f"[{i}/{len(segments)}] {segment}"
            else:
                segment_msg = segment
            
            # Build API parameters
            params = {
                "api_username": api_username,
                "api_password": api_password,
                "method": "sendSMS",
                "did": did,
                "dst": dst,
                "message": segment_msg
            }
            
            logger.info(f"Sending segment {i}/{len(segments)} to {dst}")
            
            # Make API request
            response = requests.get(VOIPMS_API_URL, params=params, timeout=10)
            response.raise_for_status()
            
            # Parse response
            response_data = response.json()
            
            # Check for errors
            if response_data.get("status") != "success":
                error_msg = response_data.get("status", "Unknown error")
                logger.error(f"VoIP.ms API error: {error_msg}")
                raise VoIPMSError(f"API returned error: {error_msg}")
            
            results.append({
                "segment": i,
                "status": "success",
                "sms_id": response_data.get("sms", "unknown")
            })
            
            logger.info(f"Segment {i} sent successfully. SMS ID: {response_data.get('sms')}")
        
        return {
            "success": True,
            "segments_sent": len(results),
            "total_segments": len(segments),
            "results": results,
            "destination": dst
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error: {str(e)}")
        return {
            "success": False,
            "error": f"Network error: {str(e)}",
            "destination": dst
        }
    except VoIPMSError as e:
        logger.error(f"VoIP.ms error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "destination": dst
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "destination": dst
        }


def send_horoscope_sms(
    api_username: str,
    api_password: str,
    did: str,
    dst: str,
    horoscope_data: Dict,
    is_couples: bool = False
) -> Dict:
    """
    Send a formatted horoscope via SMS.
    
    Args:
        api_username: VoIP.ms API username
        api_password: VoIP.ms API password
        did: Sender phone number
        dst: Destination phone number
        horoscope_data: Horoscope data dict from generator
        is_couples: Whether this is a couples horoscope
    
    Returns:
        Dict with sending status
    """
    try:
        if is_couples:
            # Format couples horoscope
            message = format_couples_horoscope_sms(horoscope_data)
        else:
            # Format single horoscope
            message = format_single_horoscope_sms(horoscope_data)
        
        logger.info(f"Sending horoscope SMS to {dst}")
        logger.info(f"Message length: {len(message)} characters")
        
        result = send_sms_voipms(
            api_username=api_username,
            api_password=api_password,
            did=did,
            dst=dst,
            message=message,
            split_long_messages=True
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error sending horoscope SMS: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "destination": dst
        }


def format_single_horoscope_sms(data: Dict) -> str:
    """Format single horoscope for SMS delivery"""
    message = f"✨ Daily Horoscope for {data['name']} ✨\n\n"
    message += f"{data['horoscope']}\n\n"
    message += f"🎨 Lucky Color: {data['lucky_color']}\n"
    message += f"💫 Mantra: {data['mantra']}\n"
    message += f"🎯 Focus: {data['daily_focus']}"
    return message


def format_couples_horoscope_sms(data: Dict) -> str:
    """Format couples horoscope for SMS delivery"""
    message = f"💕 Couples Horoscope 💕\n"
    message += f"{data['name_1']} & {data['name_2']}\n\n"
    message += f"{data['couples_horoscope']}\n\n"
    message += f"🎨 Lucky Color: {data['lucky_color']}\n"
    message += f"💫 Shared Mantra: {data['shared_mantra']}\n"
    message += f"💞 Focus: {data['relationship_focus']}"
    return message


def send_to_multiple(
    api_username: str,
    api_password: str,
    did: str,
    destinations: List[str],
    horoscope_data: Dict,
    is_couples: bool = False
) -> Dict:
    """
    Send horoscope to multiple phone numbers.
    
    Args:
        api_username: VoIP.ms API username
        api_password: VoIP.ms API password
        did: Sender phone number
        destinations: List of destination phone numbers
        horoscope_data: Horoscope data
        is_couples: Whether this is a couples horoscope
    
    Returns:
        Dict with results for all destinations
    """
    results = []
    
    for dst in destinations:
        result = send_horoscope_sms(
            api_username=api_username,
            api_password=api_password,
            did=did,
            dst=dst,
            horoscope_data=horoscope_data,
            is_couples=is_couples
        )
        results.append(result)
    
    success_count = sum(1 for r in results if r.get("success"))
    
    return {
        "total_sent": len(destinations),
        "successful": success_count,
        "failed": len(destinations) - success_count,
        "results": results
    }


# Example usage and testing
if __name__ == "__main__":
    print("=" * 60)
    print("SMS MODULE TEST")
    print("=" * 60)
    
    # Test message splitting
    long_message = "This is a very long message that needs to be split into multiple segments. " * 5
    segments = split_message(long_message)
    print(f"\nOriginal message length: {len(long_message)} characters")
    print(f"Split into {len(segments)} segments:")
    for i, seg in enumerate(segments, 1):
        print(f"  Segment {i}: {len(seg)} characters")
    
    # Test formatting
    print("\n" + "=" * 60)
    print("FORMATTING TEST")
    print("=" * 60)
    
    single_data = {
        "name": "Emma",
        "sign": "Pisces",
        "horoscope": "Today brings beautiful energy for growth and connection.",
        "lucky_color": "Aquamarine",
        "mantra": "I embrace growth with an open heart",
        "daily_focus": "Self-care"
    }
    
    formatted = format_single_horoscope_sms(single_data)
    print("\nFormatted Single Horoscope SMS:")
    print(formatted)
    print(f"\nLength: {len(formatted)} characters")
    
    couples_data = {
        "name_1": "Alex",
        "sign_1": "Leo",
        "name_2": "Jordan",
        "sign_2": "Aquarius",
        "couples_horoscope": "Your combined energy creates magic today.",
        "lucky_color": "Purple",
        "shared_mantra": "Together, we are stronger",
        "relationship_focus": "Communication"
    }
    
    formatted_couples = format_couples_horoscope_sms(couples_data)
    print("\nFormatted Couples Horoscope SMS:")
    print(formatted_couples)
    print(f"\nLength: {len(formatted_couples)} characters")
    
    print("\n" + "=" * 60)
    print("NOTE: To actually send SMS, provide your VoIP.ms credentials:")
    print("  - API Username (your email)")
    print("  - API Password")
    print("  - DID (your VoIP.ms phone number)")
    print("=" * 60)
