# Example JSON Outputs

This file contains example JSON responses from the horoscope generator system.

---

## Single Person Horoscope Example 1

**Input:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "context": "Feeling stressed about work but hopeful about new opportunities"
}
```

**Output:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "horoscope": "Dear Emma, today's cosmic energy brings a wave of renewal and possibility. As a Pisces, you're particularly attuned to the shifts happening around you, and this is your moment to shine. The universe is aligning to support your dreams, encouraging you to trust your intuition and take meaningful steps forward. You may feel a surge of creative inspiration or a desire to connect more deeply with those you cherish. Remember, growth sometimes asks you to be vulnerable, but that vulnerability is your strength. Embrace this day with an open heart, knowing you're exactly where you need to be. Your authentic self is your greatest gift, and the world is ready to receive it. Trust the process, Emma, and watch as beautiful opportunities unfold before you.",
  "lucky_color": "Aquamarine",
  "mantra": "I embrace growth with an open heart",
  "daily_focus": "Self-care",
  "generated_at": "2024-01-15T10:30:00.000Z"
}
```

---

## Single Person Horoscope Example 2

**Input:**
```json
{
  "name": "Marcus",
  "sign": "Leo",
  "context": "Starting a new creative project, feeling excited and nervous"
}
```

**Output:**
```json
{
  "name": "Marcus",
  "sign": "Leo",
  "horoscope": "Marcus, the stars are sending you powerful affirmations today. As a Leo, your natural gifts are being amplified by celestial energy that celebrates authenticity and courage. This is a time to honor your feelings, express your truth, and take bold steps toward what makes your soul sing. You might encounter situations that challenge you to grow, but these are invitations to discover your inner resilience. The connections you nurture today will flourish, and your presence brings warmth to everyone around you. Don't be afraid to ask for what you need—the universe supports those who honor their worth. Your journey is unfolding beautifully, even if you can't see the full picture yet. Keep your heart open, trust your path, and remember that you're surrounded by love and possibility.",
  "lucky_color": "Gold",
  "mantra": "I radiate confidence and inner strength",
  "daily_focus": "Creativity",
  "generated_at": "2024-01-15T10:31:15.000Z"
}
```

---

## Couples Horoscope Example 1

**Input:**
```json
{
  "name_1": "Alex",
  "sign_1": "Leo",
  "name_2": "Jordan",
  "sign_2": "Aquarius",
  "context": "Long distance relationship, planning to reunite soon"
}
```

**Output:**
```json
{
  "name_1": "Alex",
  "sign_1": "Leo",
  "name_2": "Jordan",
  "sign_2": "Aquarius",
  "couples_horoscope": "Alex and Jordan, your combined energy is creating something truly magical right now. As a Leo and Aquarius pairing, you bring complementary strengths that make your bond uniquely powerful. Alex, your natural Leo qualities help ground this relationship in authenticity, while Jordan, your Aquarius energy adds depth and emotional richness. This period invites you both to celebrate how far you've come together and to dream even bigger about your shared future. You're entering a phase where communication flows more easily, where understanding deepens naturally, and where your love feels renewed. Any challenges you face become opportunities to strengthen your connection and prove to yourselves just how resilient your partnership is. Take time this week to do something special together—even small gestures carry profound meaning now. Your love story is evolving beautifully, and the universe is conspiring to bring you even closer. Trust each other, celebrate each other, and know that your bond is a source of strength for both of you.",
  "lucky_color": "Purple",
  "shared_mantra": "Together, we are stronger",
  "relationship_focus": "Communication",
  "generated_at": "2024-01-15T10:32:45.000Z"
}
```

---

## Couples Horoscope Example 2

**Input:**
```json
{
  "name_1": "Sarah",
  "sign_1": "Cancer",
  "name_2": "Michael",
  "sign_2": "Capricorn",
  "context": "Celebrating 5 years together, planning their future"
}
```

**Output:**
```json
{
  "name_1": "Sarah",
  "sign_1": "Cancer",
  "name_2": "Michael",
  "sign_2": "Capricorn",
  "couples_horoscope": "Beautiful souls Sarah and Michael, the cosmic energy surrounding your relationship is radiant with possibility. Your Cancer-Capricorn connection brings together two different but harmonious energies, creating a partnership that's both stable and dynamic. Sarah, you bring gifts of Cancer wisdom that help navigate life's complexities, while Michael, your Capricorn spirit adds passion and spontaneity to your shared journey. Right now, the stars are highlighting the importance of mutual support and shared dreams. You're being reminded that your partnership is a safe haven where both of you can be completely authentic. This is a powerful time for intimate conversations, for planning adventures together, and for reconnecting with why you chose each other. Any moments of tension are simply invitations to practice deeper understanding and compassion. Your love has a sacred quality to it—treasure it, nurture it, and watch it blossom even more beautifully. The universe celebrates your union and surrounds you both with abundant blessings.",
  "lucky_color": "Emerald",
  "shared_mantra": "Our love grows deeper each day",
  "relationship_focus": "Growth",
  "generated_at": "2024-01-15T10:34:20.000Z"
}
```

---

## SMS Delivery Response Example

**Request:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "phone": "+12025551234"
}
```

**Response:**
```json
{
  "success": true,
  "horoscope": {
    "name": "Emma",
    "sign": "Pisces",
    "horoscope": "Dear Emma, today's cosmic energy brings...",
    "lucky_color": "Aquamarine",
    "mantra": "I embrace growth with an open heart",
    "daily_focus": "Self-care",
    "generated_at": "2024-01-15T10:35:00.000Z"
  },
  "sms_result": {
    "success": true,
    "segments_sent": 3,
    "total_segments": 3,
    "results": [
      {
        "segment": 1,
        "status": "success",
        "sms_id": "12345"
      },
      {
        "segment": 2,
        "status": "success",
        "sms_id": "12346"
      },
      {
        "segment": 3,
        "status": "success",
        "sms_id": "12347"
      }
    ],
    "destination": "2025551234"
  }
}
```

---

## Email Delivery Response Example

**Request:**
```json
{
  "name": "Emma",
  "sign": "Pisces",
  "email": "emma@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "horoscope": {
    "name": "Emma",
    "sign": "Pisces",
    "horoscope": "Dear Emma, today's cosmic energy brings...",
    "lucky_color": "Aquamarine",
    "mantra": "I embrace growth with an open heart",
    "daily_focus": "Self-care",
    "generated_at": "2024-01-15T10:36:00.000Z"
  },
  "email_result": {
    "success": true,
    "provider": "mailgun",
    "recipient": "emma@example.com",
    "message_id": "20240115103600.1.ABC123@mg.example.com"
  }
}
```

---

## Couples Delivery Response Example

**Request:**
```json
{
  "name_1": "Alex",
  "sign_1": "Leo",
  "name_2": "Jordan",
  "sign_2": "Aquarius",
  "phone_1": "+12025551111",
  "phone_2": "+12025552222",
  "email_1": "alex@example.com",
  "email_2": "jordan@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "horoscope": {
    "name_1": "Alex",
    "sign_1": "Leo",
    "name_2": "Jordan",
    "sign_2": "Aquarius",
    "couples_horoscope": "Alex and Jordan, your combined energy...",
    "lucky_color": "Purple",
    "shared_mantra": "Together, we are stronger",
    "relationship_focus": "Communication",
    "generated_at": "2024-01-15T10:37:00.000Z"
  },
  "sms_results": [
    {
      "phone": "+12025551111",
      "result": {
        "success": true,
        "segments_sent": 4,
        "total_segments": 4,
        "destination": "2025551111"
      }
    },
    {
      "phone": "+12025552222",
      "result": {
        "success": true,
        "segments_sent": 4,
        "total_segments": 4,
        "destination": "2025552222"
      }
    }
  ],
  "email_results": [
    {
      "email": "alex@example.com",
      "result": {
        "success": true,
        "provider": "mailgun",
        "recipient": "alex@example.com"
      }
    },
    {
      "email": "jordan@example.com",
      "result": {
        "success": true,
        "provider": "mailgun",
        "recipient": "jordan@example.com"
      }
    }
  ]
}
```

---

## Error Response Examples

### Missing Required Fields
```json
{
  "error": "Missing required fields: name, sign"
}
```

### VoIP.ms API Error
```json
{
  "success": false,
  "horoscope": { ... },
  "sms_result": {
    "success": false,
    "error": "VoIP.ms API error: invalid_credentials",
    "destination": "2025551234"
  }
}
```

### Email Provider Error
```json
{
  "success": false,
  "horoscope": { ... },
  "email_result": {
    "success": false,
    "provider": "mailgun",
    "error": "Mailgun error: 401",
    "recipient": "emma@example.com"
  }
}
```

---

## Formatted SMS Message Examples

### Single Person SMS
```
✨ Daily Horoscope for Emma ✨

Dear Emma, today's cosmic energy brings a wave of renewal and possibility. As a Pisces, you're particularly attuned to the shifts happening around you, and this is your moment to shine. The universe is aligning to support your dreams, encouraging you to trust your intuition and take meaningful steps forward.

🎨 Lucky Color: Aquamarine
💫 Mantra: I embrace growth with an open heart
🎯 Focus: Self-care
```

### Couples SMS
```
💕 Couples Horoscope 💕
Alex & Jordan

Alex and Jordan, your combined energy is creating something truly magical right now. As a Leo and Aquarius pairing, you bring complementary strengths that make your bond uniquely powerful. This period invites you both to celebrate how far you've come together and to dream even bigger about your shared future.

🎨 Lucky Color: Purple
💫 Shared Mantra: Together, we are stronger
💞 Focus: Communication
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Phone numbers are normalized to digits only in responses
- SMS messages are automatically split if longer than 160 characters
- HTML email templates include inline CSS for compatibility
- All horoscopes maintain a positive, uplifting tone
- Context fields are optional but improve personalization
