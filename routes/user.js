import express from "express";
import { supabase } from "../index.js";

const router = express.Router();

// ✅ helper to extract logged-in user from Bearer token
async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) throw { status: 401, message: "No token" };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw { status: 401, message: error?.message || "Unauthorized" };

  return data.user;
}

// ✅ Set username
router.post("/set-username", async (req, res) => {
  try {
    const user = await getUser(req);
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: "username required" });

    // check if taken
    const { data: exists } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (exists) return res.status(409).json({ error: "username taken" });

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Done! Your username is set", profile: data });
  } catch (e) {
    res.status(e.status || 500).json({
      msg: "Error occurred in set-username",
      error: e.message || e
    });
  }
});

// ✅ Search users
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .ilike("username", `${q}%`)
      .limit(10);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Add friend
router.post("/add-friend", async (req, res) => {
  try {
    const user = await getUser(req);
    const { friend_id } = req.body;

    if (!friend_id) return res.status(400).json({ error: "friend_id required" });
    if (friend_id === user.id) return res.status(400).json({ error: "cannot add yourself" });

    // Insert both directions (me→friend, friend→me)
    const { error } = await supabase.from("friends").upsert([
      { user_id: user.id, friend_id },
      { user_id: friend_id, friend_id: user.id }
    ]);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Friend added successfully" });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || e });
  }
});

router.get("/friends", async (req, res) => {
  try {
    const user = await getUser(req);

    // Fetch friends and join with profiles via friend_id
  const { data, error } = await supabase
  .from("friends")
  .select(`
    friend_id,
    friend_profile:profiles!fk_friend (
      username,
      display_name,
      avatar_url
    )
  `)
  .eq("user_id", user.id);


    if (error) return res.status(400).json({ error: error.message });

    res.json({ friends: data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || e });
  }
});


router.post("/send-message", async (req, res) => {
  try {
    const user = await getUser(req);
    const { conversation_id, content } = req.body;

    if (!conversation_id || !content)
      return res.status(400).json({ error: "conversation_id and content required" });

    const { error } = await supabase
      .from("messages")
      .insert([{ conversation_id, sender_id: user.id, content }]);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "sent" });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

export default router;
