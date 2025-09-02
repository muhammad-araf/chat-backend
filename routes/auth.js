import express from "express";
import { supabase } from "../index.js";

const router = express.Router();

// Sign up with email and password
router.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Signup successful, check your email to confirm.", data });
});

// Login with email and password
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Login successful", session: data.session });
});

// Get Google OAuth URL for sign-in
router.get("/auth/google", (req, res) => {
    const { redirectTo = `${req.headers.origin}/auth/callback` } = req.query;
    
    const { data, error } = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo
        }
    });

    if (error) return res.status(400).json({ error: error.message });
    
    // Redirect to Google OAuth URL
    res.redirect(data.url);
});

// Google OAuth callback handler
router.get("/auth/callback", async (req, res) => {
    const { code, error: oauthError } = req.query;

    if (oauthError) {
        return res.status(400).json({ error: oauthError });
    }

    if (!code) {
        return res.status(400).json({ error: "No authorization code provided" });
    }

    try {
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Successful authentication - you can redirect to your frontend or return session data
        res.json({
            message: "Google authentication successful",
            session: data.session,
            user: data.user
        });

    } catch (error) {
        res.status(500).json({ error: "Internal server error during authentication" });
    }
});

// Alternative: Direct Google sign-in that returns URL for frontend redirection
router.post("/signup/google", async (req, res) => {
    const { redirectTo } = req.body;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo || `${req.headers.origin}/auth/callback`
        }
    }); 

    if (error) return res.status(400).json({ error: error.message });
    res.json({ url: data.url });
});

// Alternative: Direct Google login that returns URL for frontend redirection
router.post("/login/google", async (req, res) => {
    const { redirectTo } = req.body;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo || `${req.headers.origin}/auth/callback`
        }
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ url: data.url });
});

// Get user profile
router.get("/profile", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const { data, error } = await supabase.auth.getUser(token);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user });
});

// Logout endpoint
router.post("/logout", async (req, res) => {
    const { error } = await supabase.auth.signOut();
    
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Logout successful" });
});

export default router;