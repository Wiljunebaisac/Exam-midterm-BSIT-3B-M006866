
(() => {
  "use strict";

  const config = window.SCHOLARTRACK_CONFIG;

  // 1. Check Supabase configuration
  if (
    !config?.supabaseUrl ||
    !config?.supabasePublishableKey ||
    !window.supabase
  ) {
    console.error(
      "Supabase configuration missing. Check js/config.js and the Supabase library."
    );
    return;
  }

  // 2. Create Supabase client
  const client = window.supabase.createClient(
    config.supabaseUrl,
    config.supabasePublishableKey
  );

  window.scholarTrackSupabase = client;

  // 3. Display messages on the page
  function showMessage(message, success = false) {
    const box = document.getElementById("message");

    if (!box) {
      console.log(message);
      return;
    }

    box.style.display = "block";
    box.style.background = success ? "#dcfce7" : "#fee2e2";
    box.style.color = success ? "#166534" : "#991b1b";
    box.textContent = message;
  }

  // 4. Get the logged-in user's profile
  async function getProfile(userId) {
    const { data, error } = await client
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(
        `Profile error: ${error.message} (${error.code || "unknown"})`
      );
    }

    if (!data) {
      throw new Error("No profile exists for this account.");
    }

    return data;
  }

  // 5. Send each role to its dashboard
  async function routeUser(user) {
    const profile = await getProfile(user.id);

    if (profile.role === "admin") {
      window.location.replace("admin.html");
    } else if (profile.role === "staff") {
      window.location.replace("index.html");
    } else if (profile.role === "scholar") {
      window.location.replace("scholar.html");
    } else {
      throw new Error(
        `Invalid account role: ${profile.role || "not assigned"}`
      );
    }
  }

  // 6. Login form
  async function initializeLogin() {
    const form = document.getElementById("loginForm");

    // This page has no login form, so nothing to do.
    if (!form) return;

    // Check whether the user already has a session.
    try {
      const {
        data: { session },
        error
      } = await client.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        await routeUser(session.user);
        return;
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const button = document.getElementById("loginButton");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      if (!emailInput || !passwordInput || !button) {
        showMessage(
          "Login form elements are missing. Check the IDs in login.html."
        );
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showMessage("Please enter your email and password.");
        return;
      }

      button.disabled = true;
      button.textContent = "Signing in...";

      try {
        // Verify credentials with Supabase Auth.
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw new Error(`Authentication error: ${error.message}`);
        }

        if (!data.user) {
          throw new Error("Login succeeded, but no user was returned.");
        }

        // Find the user's profile and open the correct dashboard.
        await routeUser(data.user);
      } catch (error) {
        console.error("Login failed:", error);

        showMessage(
          error.message || "Login failed. Please try again."
        );

        button.disabled = false;
        button.textContent = "Sign in";
      }
    });
  }

  // 7. Logout function
  async function logout() {
    const { error } = await client.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      alert("Logout failed: " + error.message);
      return;
    }

    window.location.replace("login.html");
  }

  window.scholarTrackLogout = logout;

  // 8. Protect dashboard pages by role
  window.requireScholarTrackUser = async function (allowedRoles = []) {
    const {
      data: { session },
      error
    } = await client.auth.getSession();

    if (error || !session?.user) {
      window.location.replace("login.html");
      return null;
    }

    try {
      const profile = await getProfile(session.user.id);

      // If this page requires a specific role, check it.
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(profile.role)
      ) {
        if (profile.role === "admin") {
          window.location.replace("admin.html");
        } else if (profile.role === "staff") {
          window.location.replace("index.html");
        } else {
          window.location.replace("scholar.html");
        }

        return null;
      }

      return {
        user: session.user,
        profile
      };
    } catch (error) {
      console.error("Dashboard access check failed:", error);
      await client.auth.signOut();
      window.location.replace("login.html");
      return null;
    }
  };

  // 9. Initialize the login page
  document.addEventListener("DOMContentLoaded", initializeLogin);
})();
