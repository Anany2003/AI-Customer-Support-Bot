# AI Customer Support Bot

A full-stack chatbot that handles customer support queries using a mix of predefined FAQs and an AI language model.
Unanswered queries are escalated via email to a human support address.

---

## Overview

This project simulates a customer support system where a chatbot first tries to answer user questions from a local FAQ dataset.
If no relevant FAQ is found, the query is sent to an LLM (via OpenRouter or OpenAI).
When the model cannot produce a confident answer, the bot asks the user to provide their issue and contact email and sends an escalation email to the configured support inbox.

The goal is to demonstrate:

* Integration of an LLM API with a structured fallback flow
* Simple local FAQ lookup
* Email-based escalation
* A persistent, browser-based chat interface

---

## Features

* Responsive chat UI built with **React + TailwindCSS**
* Backend API using **FastAPI (Python)**
* FAQ lookup before calling the LLM
* Model integration via **OpenRouter / OpenAI API**
* Escalation via SMTP (Gmail / Outlook / Mailtrap)
* Persistent chat history using `localStorage`
* Typing indicator and “Clear Chat” option

---

## Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React, Vite, TailwindCSS, Axios                |
| Backend  | FastAPI, Python 3, Requests                    |
| LLM      | OpenRouter (GPT-4.1-mini, GPT-3.5-turbo, etc.) |
| Email    | SMTP                                           |
| Data     | Local JSON (faq.json)                          |

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ai-support-bot.git
cd ai-support-bot
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate    # On Windows (use forward slashes if using Git Bash)
pip install -r requirements.txt
```

### 3. Configure API and email

Create or edit `backend/config.json`:

```json
{
  "openrouter_api_key": "or-your-key-or-sk-key",
  "openrouter_api_url": "https://openrouter.ai/api/v1/chat/completions",
  "support_email": "support@example.com",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "youremail@gmail.com",
    "password": "your_app_password",
    "from": "youremail@gmail.com"
  }
}
```

> Use an [App Password](https://myaccount.google.com/apppasswords) if using Gmail.

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`

---

### 4. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Usage

1. Open the frontend in your browser (`localhost:5173`).
2. Ask a question:

   * If it matches an FAQ → instant response.
   * If not → handled by the LLM.
   * If model is unsure → bot prompts for issue + email and sends an escalation email.
3. Chat persists after refresh.
   Use the **Clear Chat** button to reset.

---

## Example

**User:** hi
**Bot:** Hello! How can I assist you today?

**User:** how can I reset my password
**Bot:** You can reset your password by clicking *Forgot Password* on the login page.

**User:** refund not processed
**Bot:** I’m not sure about that. Would you like me to escalate this to support?
→ User clicks **Yes, escalate**
→ Prompt appears: “Please type your query and contact email”
→ Email sent to configured support address.

---

## Configuration Notes

* To use OpenAI instead of OpenRouter, update:

  ```json
  "openrouter_api_url": "https://api.openai.com/v1/chat/completions"
  ```

  and use a key starting with `sk-`.
* FAQ data can be modified in `backend/faq.json`.
* The escalation email format is defined in `backend/email_util.py`.

---

## Project Structure

```
ai-support-bot/
│
├── backend/
│   ├── main.py
│   ├── email_util.py
│   ├── faq.json
│   ├── config.json
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.jsx
    │   ├── components/
    │   │   ├── ChatWindow.jsx
    │   │   ├── InputBar.jsx
    │   │   ├── MessageBubble.jsx
    │   │   └── TypingIndicator.jsx
    ├── index.html
    ├── package.json
    └── tailwind.config.js

