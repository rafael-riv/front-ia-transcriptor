export function useUserSession() {
    const loggedIn = ref(false); // Add reactive logged in state

    const login = async (creds: { email: string; password: string }) => {
        await $fetch("/api/login", {
            method: "POST",
            body: creds,
        });
        loggedIn.value = true; // Update state on successful login
    };

    const loggingOut = async () => {
        await $fetch("/api/logout", { method: "POST" });
        loggedIn.value = false; // Update state on logout
    };

    return { login, loggingOut, loggedIn };
}
