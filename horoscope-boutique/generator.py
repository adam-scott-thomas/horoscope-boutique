"""
Horoscope Generator Module
Generates uplifting single and couples horoscopes
"""

import random
from datetime import datetime
from typing import Dict, Optional

# Master Prompt Templates
SINGLE_HOROSCOPE_TEMPLATE = """
Generate an uplifting, warm, and emotionally encouraging horoscope for {name} ({sign}).

TONE: Warm, supportive, emotionally encouraging, optimistic
LENGTH: 120-180 words
STYLE: Direct, personal, speaks to {name} by name

CONTEXT: {context}

REQUIREMENTS:
- Address {name} directly throughout
- Focus on positive energy, growth, opportunities, and emotional well-being
- Reframe any challenges as opportunities for growth
- Avoid: negativity, doom, betrayal, danger, illness, breakups, warnings
- Include themes of: hope, connection, self-discovery, inner strength, joy
- Be specific to {sign} traits and current cosmic energy

STRUCTURE:
1. Opening: Acknowledge current energy/moment (2-3 sentences)
2. Core message: Main uplifting insight (3-4 sentences)
3. Actionable wisdom: Gentle guidance (2-3 sentences)
4. Closing: Affirming, hopeful note (1-2 sentences)

Generate the horoscope now:
"""

COUPLES_HOROSCOPE_TEMPLATE = """
Generate an uplifting couples horoscope for {name_1} ({sign_1}) and {name_2} ({sign_2}).

TONE: Warm, romantic, encouraging, celebrating their bond
LENGTH: 150-220 words
STYLE: Speaks to BOTH partners, acknowledges their unique connection

CONTEXT: {context}

REQUIREMENTS:
- Address both {name_1} and {name_2} by name
- Celebrate their combined energy and compatibility
- Frame their relationship positively as a source of growth and joy
- Reframe any challenges as opportunities for deeper connection
- Avoid: negativity, breakup warnings, betrayal, doom, conflict without resolution
- Include themes of: unity, mutual support, shared dreams, emotional intimacy, partnership growth
- Reference both {sign_1} and {sign_2} energies and how they complement each other

STRUCTURE:
1. Opening: Acknowledge their combined cosmic energy (2-3 sentences)
2. Relationship dynamics: How their signs interact beautifully (3-4 sentences)
3. Current phase: What this moment offers their bond (3-4 sentences)
4. Shared guidance: Actionable wisdom for both (2-3 sentences)
5. Closing: Affirming their love and future together (1-2 sentences)

Generate the couples horoscope now:
"""

# Lucky colors by zodiac sign
LUCKY_COLORS = {
    "aries": ["Red", "Coral", "Scarlet"],
    "taurus": ["Green", "Pink", "Emerald"],
    "gemini": ["Yellow", "Light Blue", "Silver"],
    "cancer": ["White", "Silver", "Pale Blue"],
    "leo": ["Gold", "Orange", "Purple"],
    "virgo": ["Navy Blue", "Grey", "Beige"],
    "libra": ["Pink", "Light Blue", "Lavender"],
    "scorpio": ["Deep Red", "Black", "Burgundy"],
    "sagittarius": ["Purple", "Royal Blue", "Turquoise"],
    "capricorn": ["Brown", "Dark Green", "Charcoal"],
    "aquarius": ["Electric Blue", "Silver", "Turquoise"],
    "pisces": ["Sea Green", "Lavender", "Aquamarine"]
}

# Uplifting mantras
MANTRAS = [
    "I am exactly where I need to be",
    "I embrace growth with an open heart",
    "My energy attracts beautiful possibilities",
    "I trust the journey unfolding before me",
    "I am worthy of love, joy, and success",
    "Today, I choose peace and positivity",
    "I am aligned with my highest purpose",
    "I radiate confidence and inner strength",
    "I welcome abundance in all its forms",
    "My heart is open to new connections",
    "I honor my emotions and my truth",
    "I am creating the life I deserve"
]

# Shared mantras for couples
SHARED_MANTRAS = [
    "Together, we are stronger",
    "Our love grows deeper each day",
    "We choose each other, always",
    "Our bond is unbreakable and true",
    "We support each other's dreams",
    "Love guides our every step together",
    "We create magic in our togetherness",
    "Our hearts beat as one",
    "We are partners in joy and growth",
    "Together, we can overcome anything",
    "Our love story is just beginning",
    "We nurture what we've built together"
]

# Daily focus areas
DAILY_FOCUS = [
    "Self-care", "Communication", "Creativity", "Connection",
    "Gratitude", "Joy", "Growth", "Balance", "Adventure",
    "Reflection", "Love", "Courage", "Renewal", "Trust",
    "Expression", "Compassion", "Discovery", "Peace"
]

# Relationship focus areas
RELATIONSHIP_FOCUS = [
    "Communication", "Trust", "Intimacy", "Adventure",
    "Growth", "Support", "Playfulness", "Understanding",
    "Passion", "Partnership", "Harmony", "Unity",
    "Celebration", "Connection", "Renewal", "Dreams"
]


def generate_single_horoscope(
    name: str,
    sign: str,
    context: Optional[str] = None,
    ai_generate_func=None
) -> Dict[str, str]:
    """
    Generate a single person horoscope.
    
    Args:
        name: Person's name
        sign: Zodiac sign (lowercase)
        context: Optional context about current situation
        ai_generate_func: Optional function to call AI model (if None, returns template)
    
    Returns:
        Dict with horoscope data
    """
    sign = sign.lower()
    
    if context is None:
        context = "No specific context provided. Generate based on general positive energy."
    
    # Fill the template
    prompt = SINGLE_HOROSCOPE_TEMPLATE.format(
        name=name,
        sign=sign.capitalize(),
        context=context
    )
    
    # If AI function provided, use it; otherwise return example
    if ai_generate_func:
        horoscope_text = ai_generate_func(prompt)
    else:
        # Generate example horoscope
        horoscope_text = generate_example_single_horoscope(name, sign)
    
    # Select lucky elements
    lucky_color = random.choice(LUCKY_COLORS.get(sign, ["Blue"]))
    mantra = random.choice(MANTRAS)
    daily_focus = random.choice(DAILY_FOCUS)
    
    return {
        "name": name,
        "sign": sign.capitalize(),
        "horoscope": horoscope_text,
        "lucky_color": lucky_color,
        "mantra": mantra,
        "daily_focus": daily_focus,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }


def generate_couples_horoscope(
    name_1: str,
    sign_1: str,
    name_2: str,
    sign_2: str,
    context: Optional[str] = None,
    ai_generate_func=None
) -> Dict[str, str]:
    """
    Generate a couples horoscope.
    
    Args:
        name_1: First partner's name
        sign_1: First partner's zodiac sign
        name_2: Second partner's name
        sign_2: Second partner's zodiac sign
        context: Optional relationship context
        ai_generate_func: Optional function to call AI model
    
    Returns:
        Dict with couples horoscope data
    """
    sign_1 = sign_1.lower()
    sign_2 = sign_2.lower()
    
    if context is None:
        context = "No specific relationship context provided. Focus on general positive partnership energy."
    
    # Fill the template
    prompt = COUPLES_HOROSCOPE_TEMPLATE.format(
        name_1=name_1,
        sign_1=sign_1.capitalize(),
        name_2=name_2,
        sign_2=sign_2.capitalize(),
        context=context
    )
    
    # If AI function provided, use it; otherwise return example
    if ai_generate_func:
        horoscope_text = ai_generate_func(prompt)
    else:
        # Generate example horoscope
        horoscope_text = generate_example_couples_horoscope(name_1, sign_1, name_2, sign_2)
    
    # Select lucky elements (blend both signs)
    colors_1 = LUCKY_COLORS.get(sign_1, ["Blue"])
    colors_2 = LUCKY_COLORS.get(sign_2, ["Pink"])
    lucky_color = random.choice(colors_1 + colors_2)
    
    shared_mantra = random.choice(SHARED_MANTRAS)
    relationship_focus = random.choice(RELATIONSHIP_FOCUS)
    
    return {
        "name_1": name_1,
        "sign_1": sign_1.capitalize(),
        "name_2": name_2,
        "sign_2": sign_2.capitalize(),
        "couples_horoscope": horoscope_text,
        "lucky_color": lucky_color,
        "shared_mantra": shared_mantra,
        "relationship_focus": relationship_focus,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }


def generate_example_single_horoscope(name: str, sign: str) -> str:
    """Generate a realistic example horoscope for demonstration"""
    templates = [
        f"Dear {name}, today's cosmic energy brings a wave of renewal and possibility. As a {sign.capitalize()}, you're particularly attuned to the shifts happening around you, and this is your moment to shine. The universe is aligning to support your dreams, encouraging you to trust your intuition and take meaningful steps forward. You may feel a surge of creative inspiration or a desire to connect more deeply with those you cherish. Remember, growth sometimes asks you to be vulnerable, but that vulnerability is your strength. Embrace this day with an open heart, knowing you're exactly where you need to be. Your authentic self is your greatest gift, and the world is ready to receive it. Trust the process, {name}, and watch as beautiful opportunities unfold before you.",
        
        f"{name}, the stars are sending you powerful affirmations today. As a {sign.capitalize()}, your natural gifts are being amplified by celestial energy that celebrates authenticity and courage. This is a time to honor your feelings, express your truth, and take bold steps toward what makes your soul sing. You might encounter situations that challenge you to grow, but these are invitations to discover your inner resilience. The connections you nurture today will flourish, and your presence brings warmth to everyone around you. Don't be afraid to ask for what you need—the universe supports those who honor their worth. Your journey is unfolding beautifully, even if you can't see the full picture yet. Keep your heart open, trust your path, and remember that you're surrounded by love and possibility."
    ]
    return random.choice(templates)


def generate_example_couples_horoscope(name_1: str, sign_1: str, name_2: str, sign_2: str) -> str:
    """Generate a realistic example couples horoscope"""
    templates = [
        f"{name_1} and {name_2}, your combined energy is creating something truly magical right now. As a {sign_1.capitalize()} and {sign_2.capitalize()} pairing, you bring complementary strengths that make your bond uniquely powerful. {name_1}, your natural {sign_1.capitalize()} qualities help ground this relationship in authenticity, while {name_2}, your {sign_2.capitalize()} energy adds depth and emotional richness. This period invites you both to celebrate how far you've come together and to dream even bigger about your shared future. You're entering a phase where communication flows more easily, where understanding deepens naturally, and where your love feels renewed. Any challenges you face become opportunities to strengthen your connection and prove to yourselves just how resilient your partnership is. Take time this week to do something special together—even small gestures carry profound meaning now. Your love story is evolving beautifully, and the universe is conspiring to bring you even closer. Trust each other, celebrate each other, and know that your bond is a source of strength for both of you.",
        
        f"Beautiful souls {name_1} and {name_2}, the cosmic energy surrounding your relationship is radiant with possibility. Your {sign_1.capitalize()}-{sign_2.capitalize()} connection brings together two different but harmonious energies, creating a partnership that's both stable and dynamic. {name_1}, you bring gifts of {sign_1.capitalize()} wisdom that help navigate life's complexities, while {name_2}, your {sign_2.capitalize()} spirit adds passion and spontaneity to your shared journey. Right now, the stars are highlighting the importance of mutual support and shared dreams. You're being reminded that your partnership is a safe haven where both of you can be completely authentic. This is a powerful time for intimate conversations, for planning adventures together, and for reconnecting with why you chose each other. Any moments of tension are simply invitations to practice deeper understanding and compassion. Your love has a sacred quality to it—treasure it, nurture it, and watch it blossom even more beautifully. The universe celebrates your union and surrounds you both with abundant blessings."
    ]
    return random.choice(templates)


# Example usage and testing
if __name__ == "__main__":
    print("=" * 60)
    print("SINGLE HOROSCOPE EXAMPLE")
    print("=" * 60)
    
    single = generate_single_horoscope(
        name="Emma",
        sign="Pisces",
        context="Feeling stressed about work but hopeful about new opportunities"
    )
    
    print(f"\nName: {single['name']}")
    print(f"Sign: {single['sign']}")
    print(f"\nHoroscope:\n{single['horoscope']}")
    print(f"\nLucky Color: {single['lucky_color']}")
    print(f"Mantra: {single['mantra']}")
    print(f"Daily Focus: {single['daily_focus']}")
    print(f"Generated: {single['generated_at']}")
    
    print("\n" + "=" * 60)
    print("COUPLES HOROSCOPE EXAMPLE")
    print("=" * 60)
    
    couples = generate_couples_horoscope(
        name_1="Alex",
        sign_1="Leo",
        name_2="Jordan",
        sign_2="Aquarius",
        context="Long distance relationship, planning to reunite soon"
    )
    
    print(f"\nPartners: {couples['name_1']} ({couples['sign_1']}) & {couples['name_2']} ({couples['sign_2']})")
    print(f"\nCouples Horoscope:\n{couples['couples_horoscope']}")
    print(f"\nLucky Color: {couples['lucky_color']}")
    print(f"Shared Mantra: {couples['shared_mantra']}")
    print(f"Relationship Focus: {couples['relationship_focus']}")
    print(f"Generated: {couples['generated_at']}")
