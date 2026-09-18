"""Generate a plain 10-slide hackathon pitch PDF for toothpaste.cv."""

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parents[1] / "toothpaste-cv-hackathon-pitch.pdf"

SLIDES = [
    {
        "title": "1. Title",
        "lines": [
            "toothpaste.cv",
            "",
            "Know when your smile needs a closer look.",
            "",
            "A 2-minute AI visual oral health screening.",
            "Hackathon pitch",
        ],
    },
    {
        "title": "2. Problem",
        "lines": [
            "People notice small dental concerns early,",
            "but ignore them until pain forces a visit.",
            "",
            "Common gaps:",
            "- Is this stain / chip / gum change serious?",
            "- Should I see a dentist now, or wait?",
            "- No easy way to get a first visual read at home.",
            "",
            "Result: delayed care and weaker dentist conversations.",
        ],
    },
    {
        "title": "3. Solution",
        "lines": [
            "toothpaste.cv turns guided oral photos into a clear",
            "visual screening report.",
            "",
            "What it does:",
            "- Guides users through 5 oral photo angles",
            "- Reviews visible surface-level concerns with AI",
            "- Explains what to watch and when to see a dentist",
            "",
            "Not a diagnosis. Early awareness + triage.",
        ],
    },
    {
        "title": "4. How it works",
        "lines": [
            "1. Start with a concern",
            "2. Take 5 guided photos",
            "   Front bite, left/right sides, upper arch, lower arch",
            "3. AI reviews the images against a fixed oral rubric",
            "4. Get a plain-English report with severity + evidence",
            "5. Save, track over time, and bring it to a dentist",
        ],
    },
    {
        "title": "5. What we check",
        "lines": [
            "Nine visual screening areas:",
            "",
            "1. Crowding & alignment",
            "2. Tooth wear",
            "3. Discoloration & staining",
            "4. Gum health",
            "5. Plaque & tartar buildup",
            "6. Bite alignment",
            "7. Spacing & gaps",
            "8. Chips & fractures",
            "9. Possible decay (visual flags only)",
        ],
    },
    {
        "title": "6. Product flow",
        "lines": [
            "Homepage -> Capture -> Analysis -> Report -> Timeline",
            "",
            "Capture: guided framing cues for each view",
            "Report: findings, severity, photo evidence, next step",
            "Timeline: compare screenings over time",
            "",
            "Output is dentist-ready language, not a medical claim.",
        ],
    },
    {
        "title": "7. Why it matters",
        "lines": [
            "For users:",
            "- Faster first signal when something looks off",
            "- Clearer questions for dental visits",
            "- Habit of tracking visible changes",
            "",
            "For the pitch:",
            "- Real product, end-to-end flow",
            "- Practical healthtech with strong demo potential",
            "- Clear boundary: triage, not treatment",
        ],
    },
    {
        "title": "8. Trust & boundaries",
        "lines": [
            "What toothpaste.cv provides:",
            "- Preliminary visual screening of outer enamel / smile",
            "- Flags that may deserve clinical consultation",
            "- Tracking of visible staining and alignment shifts",
            "",
            "What still needs a dentist:",
            "- X-rays, pocket depth, root issues, treatment plans",
            "",
            "Privacy: photos stay in-session; no permanent photo storage",
            "for the free screening flow.",
        ],
    },
    {
        "title": "9. Who it's for",
        "lines": [
            "Primary users:",
            "- People delaying dental visits",
            "- Anyone unsure if a visible change matters",
            "- Users preparing for a dentist appointment",
            "",
            "Positioning:",
            "Pre-visit visual triage tool.",
            "Not a clinic replacement. A smarter first step.",
        ],
    },
    {
        "title": "10. Ask / close",
        "lines": [
            "Know when your smile needs a closer look.",
            "",
            "Demo: live guided photos -> screening report",
            "",
            "Next:",
            "- Polish capture accuracy",
            "- Stronger report UX",
            "- Broader testing and feedback",
            "",
            "Try toothpaste.cv",
            "Thank you.",
        ],
    },
]


class PitchPDF(FPDF):
    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", size=9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, f"{self.page_no()} / {len(SLIDES)}", align="C")


def build() -> None:
    pdf = PitchPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=False)

    for slide in SLIDES:
        pdf.add_page()
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(0, 0, 297, 210, "F")

        pdf.set_xy(20, 18)
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(20, 20, 20)
        pdf.cell(0, 10, slide["title"], ln=1)

        pdf.set_draw_color(180, 180, 180)
        pdf.set_line_width(0.3)
        pdf.line(20, 32, 277, 32)

        pdf.set_xy(20, 42)
        pdf.set_font("Helvetica", size=15)
        pdf.set_text_color(30, 30, 30)

        for line in slide["lines"]:
            if line == "":
                pdf.ln(6)
            else:
                pdf.multi_cell(257, 8, line)
                pdf.set_x(20)

    pdf.output(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
