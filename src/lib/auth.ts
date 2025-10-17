import Profile from '$lib/Profile';
import type { User } from '@supabase/supabase-js';

// Sign up a new user (creates auth user and profile)
async function signUp(username: string, password: string) {
	try {
		const { user, profile } = await Profile.signUp(username, password);
		console.log('User signed up and signed in:', user);
		console.log('Profile created:', profile);
		return { user, profile };
	} catch (error) {
		console.error('Sign up error:', error);
		throw error;
	}
}

// Sign in an existing user
async function signIn(username: string, password: string) {
	try {
		const { user, profile } = await Profile.signIn(username, password);
		console.log('User signed in:', user);
		console.log('Profile:', profile);
		return { user, profile };
	} catch (error) {
		console.error('Sign in error:', error);
		throw error;
	}
}

// Sign out the current user
async function signOut() {
	try {
		await Profile.signOut();
		console.log('User signed out');
	} catch (error) {
		console.error('Sign out error:', error);
		throw error;
	}
}

// Get current user
async function getCurrentUser() {
	try {
		const user = await Profile.getCurrentUser();
		return user;
	} catch (error) {
		console.error('Get current user error:', error);
		return null;
	}
}

// Get current user's profile
async function getCurrentProfile() {
	try {
		const profile = await Profile.getCurrentProfile();
		return profile;
	} catch (error) {
		console.error('Get current profile error:', error);
		return null;
	}
}

// Listen to auth state changes
function setupAuthListener(callback: (user: User | null) => void) {
	const {
		data: { subscription }
	} = Profile.onAuthStateChange(callback);

	// Return unsubscribe function
	return () => subscription.unsubscribe();
}

export { signUp, signIn, signOut, getCurrentUser, getCurrentProfile, setupAuthListener };
