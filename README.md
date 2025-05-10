# Voice LLM App

A sky-blue, WhatsApp-inspired React app that lets you gab with an AI using your voice! It transforms your speech into text and beams it to OpenAI's GPT-3.5 Turbo for a clever reply. With a spinning mic, a collapsible sidebar, persistent chats, and vibrant animations, this app is your AI chat buddy! Deploy it for free on GitHub Pages.

## Features
- Speak your mind, and see your words pop into text (American English only, you smooth talker! 😎).
- Slide in a GPT-3.5 Turbo API key via the sleek collapsible sidebar (top on mobile, left on desktop).
- Mic shy? Type your message like a WhatsApp pro.
- Mic button dazzles: sky-blue, glows when off, spins and shrinks when listening, pulses orange before restarting.
- Chats look like WhatsApp: blue bubbles for you, white for AI, with timestamps and smooth scrolling.
- Saves your latest 5 chats in browser storage to keep things snappy (trims older ones to save AI tokens).
- Sends your latest message with up to 5 chats as context for brainy AI replies (cuts to 3 if too chatty!).
- Sassy toasts for oopsies, like “Yikes! Your API key is playing hide-and-seek!” 🕵️.
- Encrypts your API key so it’s ready for every visit (poof, no re-pasting! ✨).
- Mic grows big (56px), zips to the bottom-right (40px) when active, and stretches the chat to 80vh.
- Nudges you with: “Psst! Give mic permissions for voice magic. Chrome’s your best buddy! 😎”
- Sky-blue vibes with spinning mics, sliding messages, and bouncing loading dots.
- Mobile-first design, super responsive for phones and desktops.

## Prerequisites
- A computer with Node.js (snag it from https://nodejs.org, ascended
- A GitHub account (join the fun at https://github.com).
- An OpenAI API key (grab free trial credits at https://platform.openai.com/signup).

## Setup Instructions

1. **Clone the Project**:
   - Open a terminal (Command Prompt, PowerShell, or Terminal on Mac).
   - Run:
     ```
     git clone https://github.com/<your-username>/voice-llm-app.git
     cd voice-llm-app
     ```

2. **Install Dependencies**:
   - Run:
     ```
     npm install
     ```

3. **Start the App**:
   - Run:
     ```
     npm run dev
     ```
   - Visit `http://localhost:5173` in your browser.

4. **Get a GPT-3.5 Turbo API Key**:
   - Sign up at https://platform.openai.com/signup.
   - Create an API key and copy it.
   - Open the sidebar (top menu on mobile, left on desktop) and paste the key.

5. **Use the App**:
   - Grant mic permissions (Chrome’s the mic’s VIP!).
   - Tap the sky-blue mic button to talk (it spins and glows when listening!).
   - Speak in American English, or type in the WhatsApp-style input.
   - Chats appear in bubbles, with the latest 5 saved for snappy replies.
   - Watch for bouncing dots while the AI thinks and toasts for errors (like “AI’s having a brain freeze!” 🥶).
   - Mic shrinks to the bottom-right when active, and the chat stretches wide.
   - After a reply, the mic pulses orange and restarts in 2 seconds.
   - Toggle the sidebar to check or update your API key (it pulses when valid!).

## Deploy to GitHub Pages

1. **Install Deployment Tool**:
   - Run:
     ```
     npm install gh-pages --save-dev
     ```

2. **Update package.json**:
   - Add to `package.json`:
     ```json
     "homepage": "https://<your-username>.github.io/voice-llm-app",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
     ```

3. **Deploy**:
   - Run:
     ```
     npm run deploy
     ```
   - In your GitHub repo, go to Settings → Pages, set source to `gh-pages` branch, `/ (root)`.
   - Visit `https://<your-username>.github.io/voice-llm-app` to see the magic!

## Troubleshooting
- **Mic not working?** Chrome’s your pal—grant permissions or type instead! 😎
- **Invalid API key?** Your key’s gone rogue! Snag a new one from OpenAI. 🕵️
- **No response?** Check your OpenAI credits. The AI’s a diva! 🎟️
- **Layout wonky?** Refresh or try Chrome for the smoothest ride.
- **Sidebar hiding?** Tap the menu button to reveal its sky-blue glory!

## Notes
- Your API key’s encrypted in the browser, but don’t share the app publicly with your key (sneaky hackers alert! 😈).
- Free to build and deploy, but you need an OpenAI API key for AI replies.
- Keeps only the latest 5 chats to save AI tokens, keeping things zippy!
- Dive into the sky-blue vibes, spinning mic, and sassy toasts!

## License
MIT License. Remix and share this code to your heart’s content!