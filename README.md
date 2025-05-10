# Voice LLM App

A dazzling, animated React app that lets you chit-chat with an AI using your voice! It turns your speech into text and zaps it to OpenAI's GPT-3.5 Turbo for a witty response. With a glowing mic, a collapsible sidebar, persistent chats, and a rainbow of animations, this app is your ticket to AI fun! Deploy it for free on GitHub Pages.

## Features
- Talk into your mic, and watch your words turn into text (American English only, you fancy speaker! 😜).
- Pop in a GPT-3.5 Turbo API key in the snazzy collapsible sidebar (or top panel on mobile).
- No voice? No worries! Type your thoughts if the mic’s feeling shy.
- Mic glows red-hot when listening, orange before restarting, and chills in gray when off.
- Saves all your chats forever (well, in your browser’s storage) and shows them in a scrollable chat area.
- Sends your latest message to the AI with all past chats as context for smarter replies.
- Fancy toasts pop up for errors, like “Yikes! Your API key is playing hide-and-seek!” 🕵️.
- Encrypted API key storage so you don’t have to paste it every time (magic, right? ✨).
- Mic grows big, then shrinks to the top-right when you talk, making room for a giant chat area.
- Permission note: “Psst! Give mic permissions for voice magic. Chrome’s your best buddy! 😎”
- Colorful animations: shifting gradients, glowing buttons, sliding messages, and bouncing loading dots.
- Fully responsive for mobile and desktop, so you can chat anywhere!

## Prerequisites
- A computer with Node.js (grab it from https://nodejs.org, you tech wizard!).
- A GitHub account (join the party at https://github.com).
- An OpenAI API key (snag free trial credits at https://platform.openai.com/signup).

## Setup Instructions

1. **Clone the Project**:
   - Fire up a terminal (Command Prompt, PowerShell, or Terminal on Mac).
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
   - Zip over to `http://localhost:5173` in your browser.

4. **Get a GPT-3.5 Turbo API Key**:
   - Hop to https://platform.openai.com/signup and sign up.
   - Go to API keys, create a shiny new key, and copy it.
   - Click the sidebar’s menu button (top-left on mobile) and paste the key in the “GPT-3.5 Turbo API Key” box.

5. **Use the App**:
   - On mobile, tap the menu button to open the sidebar and enter your API key.
   - Grant mic permissions (Chrome’s the VIP for voice!).
   - Click the big mic button to start talking (it glows red when it’s eavesdropping! 😈).
   - Speak clearly in American English, or type if your mic’s on a coffee break.
   - Your words and the AI’s replies appear in the scrollable chat, with all past chats saved.
   - See bouncing dots while the AI thinks, and toasts for any oopsies (like “AI’s having a brain freeze!” 🥶).
   - The mic shrinks to the top-right when active, and the chat grows huge!
   - After a reply, the mic pulses orange and restarts in 2 seconds for more chatter.

## Deploy to GitHub Pages

1. **Install Deployment Tool**:
   - Run:
     ```
     npm install gh-pages --save-dev
     ```

2. **Update package.json**:
   - Open `package.json` and add:
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
   - Head to your GitHub repo → Settings → Pages.
   - Set the source to `gh-pages` branch and `/ (root)`.
   - Visit `https://<your-username>.github.io/voice-llm-app` and bask in the glow!

## Troubleshooting
- **Mic not working?** Chrome’s the mic’s BFF—grant permissions and try again. Or type it out! 😎
- **Invalid API key?** Your key’s playing hide-and-seek! Grab a fresh one from OpenAI. 🕵️
- **No response?** Check your OpenAI trial credits or paid plan. The AI’s picky! 🎟️
- **Animations slow?** The glow’s light, but try a zippy device or browser for extra sparkle.
- **Sidebar hiding?** Click the menu button (top-left on mobile) to unleash it!

## Notes
- The app’s all in your browser, so your API key’s encrypted but don’t share the app publicly with your key (sneaky hackers, beware! 😈).
- Free to build and deploy, but you’ll need an OpenAI API key for the AI’s brainpower.
- Have a blast with the glowing mic, rainbow vibes, and sassy error toasts!

## License
MIT License. Tweak and share this code to your heart’s content!