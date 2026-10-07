from database import db
import models

def seed_if_empty():
    db.connect(reuse_if_open=True)
    try:
        if models.Form.select().count() > 0:
            return

        # Form 1: Customer Feedback Survey
        f1 = models.Form.create(
            title="Customer Feedback Survey",
            description="Help us improve our platform by answering a few quick questions.",
            status="published",
            public_id="feedback2024"
        )

        q1_1 = models.Question.create(form=f1, type="short_text", title="What is your name?", required=True, order_index=1)
        q1_2 = models.Question.create(form=f1, type="email", title="What is your email address?", required=True, order_index=2)
        q1_3 = models.Question.create(form=f1, type="rating", title="How would you rate our service?", required=True, order_index=3, settings={"max": 5})
        q1_4 = models.Question.create(form=f1, type="multiple_choice", title="Which features do you use most?", order_index=4, options=['Dashboard', 'Reports', 'API', 'Mobile App', 'Integrations'])
        q1_5 = models.Question.create(form=f1, type="long_text", title="Any additional feedback or suggestions?", order_index=5)
        q1_6 = models.Question.create(form=f1, type="yes_no", title="Would you recommend us to a friend?", required=True, order_index=6)
        q1_7 = models.Question.create(form=f1, type="dropdown", title="How did you hear about us?", order_index=7, options=['Search Engine', 'Social Media', 'Friend/Colleague', 'Blog/Article', 'Advertisement', 'Other'])
        q1_8 = models.Question.create(form=f1, type="number", title="How many years have you been using our product?", order_index=8)

        demo_feedback = [
            ("Alice Smith", "alice@example.com", "5", "Dashboard", "Love the speed and design!", "Yes", "Search Engine", "2"),
            ("Bob Jones", "bob@example.com", "4", "Reports", "Could use a bit more documentation.", "Yes", "Friend/Colleague", "1"),
            ("Charlie Brown", "charlie@example.com", "5", "API", "Flawless API integration.", "Yes", "Blog/Article", "3"),
            ("Diana Prince", "diana@example.com", "3", "Mobile App", "Mobile experience is good.", "No", "Social Media", "1"),
            ("Evan Wright", "evan@example.com", "5", "Integrations", "Best form builder we tested.", "Yes", "Advertisement", "4"),
        ]

        for df in demo_feedback:
            resp = models.FormResponse.create(form=f1)
            models.Answer.create(response=resp, question=q1_1, value=df[0])
            models.Answer.create(response=resp, question=q1_2, value=df[1])
            models.Answer.create(response=resp, question=q1_3, value=df[2])
            models.Answer.create(response=resp, question=q1_4, value=df[3])
            models.Answer.create(response=resp, question=q1_5, value=df[4])
            models.Answer.create(response=resp, question=q1_6, value=df[5])
            models.Answer.create(response=resp, question=q1_7, value=df[6])
            models.Answer.create(response=resp, question=q1_8, value=df[7])

        # Form 2: Event Registration Form
        f2 = models.Form.create(
            title="Tech Summit 2026 Registration",
            description="Reserve your spot for our annual developer & designer conference.",
            status="published",
            public_id="eventreg2024"
        )

        q2_1 = models.Question.create(form=f2, type="short_text", title="Full Name", required=True, order_index=1)
        q2_2 = models.Question.create(form=f2, type="email", title="Work Email Address", required=True, order_index=2)
        q2_3 = models.Question.create(form=f2, type="dropdown", title="Which track are you attending?", required=True, order_index=3, options=['AI & Agents', 'Design Systems', 'Cloud & Scale', 'All Tracks'])
        q2_4 = models.Question.create(form=f2, type="multiple_choice", title="Dietary Requirements", order_index=4, options=['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'])
        q2_5 = models.Question.create(form=f2, type="yes_no", title="Do you require parking pass?", order_index=5)
        q2_6 = models.Question.create(form=f2, type="number", title="Number of team attendees", required=True, order_index=6)
        q2_7 = models.Question.create(form=f2, type="long_text", title="Any special accommodations or questions?", order_index=7)

        demo_events = [
            ("Sarah Connor", "sarah@tech.co", "AI & Agents", "None", "Yes", "3", "Need front row seating."),
            ("Marcus Vance", "marcus@design.io", "Design Systems", "Vegetarian", "No", "1", ""),
            ("Elena Rostova", "elena@startup.org", "All Tracks", "Vegan", "Yes", "2", "Looking forward to keynote!"),
        ]

        for de in demo_events:
            resp = models.FormResponse.create(form=f2)
            models.Answer.create(response=resp, question=q2_1, value=de[0])
            models.Answer.create(response=resp, question=q2_2, value=de[1])
            models.Answer.create(response=resp, question=q2_3, value=de[2])
            models.Answer.create(response=resp, question=q2_4, value=de[3])
            models.Answer.create(response=resp, question=q2_5, value=de[4])
            models.Answer.create(response=resp, question=q2_6, value=de[5])
            models.Answer.create(response=resp, question=q2_7, value=de[6])

        # Form 3: Product Feedback (Draft)
        f3 = models.Form.create(
            title="Q3 Product Feedback & Feature Requests",
            description="Internal evaluation draft.",
            status="draft",
            public_id="productfb24"
        )
        models.Question.create(form=f3, type="short_text", title="What team are you on?", order_index=1)
        models.Question.create(form=f3, type="rating", title="Overall experience so far", required=True, order_index=2, settings={"max": 5})
        models.Question.create(form=f3, type="multiple_choice", title="Most anticipated feature?", order_index=3, options=['Branching Logic', 'Custom CSS Themes', 'Webhooks', 'Slack Integration'])
        models.Question.create(form=f3, type="long_text", title="Elaborate on your workflow needs", order_index=4)

    finally:
        if not db.is_closed():
            db.close()
