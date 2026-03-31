from app.agent import build_instruction


def test_instruction_includes_emergency_guidance() -> None:
    instruction = build_instruction().lower()
    assert "seek immediate emergency care" in instruction
    assert "emergency services" in instruction


def test_instruction_allows_comprehensive_healthcare_guidance() -> None:
    """Verify agent can provide comprehensive medical advice, not just basic wellness."""
    instruction = build_instruction().lower()
    assert "comprehensive healthcare guidance" in instruction
    assert "healthcare advice" in instruction
    # Ensure old restrictive language is removed
    assert "basic general wellness and self-care advice only" not in instruction
    assert "never diagnose" not in instruction


def test_instruction_requires_true_save_before_logging_confirmation() -> None:
    instruction = build_instruction().lower()
    assert (
        "only tell the user that adherence was logged if save_adherence_report returns saved=true"
        in instruction
    )
