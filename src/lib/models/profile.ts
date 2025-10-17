import { supabase } from '../supabase';

export type ProfileRow = {
	id: number; // bigint
	auth_id: string; // uuid
	username: string | null;
	created_at: string;
	settings: Record<string, unknown> | null;
	bio: string | null;
	badge_id: number | null;
};

export type PublicProfileCard = {
	profile_id: number;
	username: string | null;
	badge_slug: string | null;
	badge_url: string | null;
};

export class Profile {
	static async getByAuthId(authId: string): Promise<ProfileRow | null> {
		const { data, error } = await supabase
			.from('profiles')
			.select('id, auth_id, username, created_at, settings, bio, badge_id')
			.eq('auth_id', authId)
			.maybeSingle();
		if (error) throw error;
		return data as ProfileRow | null;
	}

	static async getByProfileId(id: number): Promise<ProfileRow | null> {
		const { data, error } = await supabase
			.from('profiles')
			.select('id, auth_id, username, created_at, settings, bio, badge_id')
			.eq('id', id)
			.maybeSingle();
		if (error) throw error;
		return data as ProfileRow | null;
	}

	static async getPublicCardByProfileId(id: number): Promise<PublicProfileCard | null> {
		const { data, error } = await supabase
			.from('public_profile_cards')
			.select('profile_id, username, badge_slug, badge_url')
			.eq('profile_id', id)
			.maybeSingle();
		if (error) throw error;
		return data as PublicProfileCard | null;
	}

	static async getCurrentProfile(): Promise<ProfileRow | null> {
		const {
			data: { user },
			error
		} = await supabase.auth.getUser();
		if (error) throw error;
		if (!user) return null;

		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return null;

		return this.getByAuthId(user.id);
	}

	static async signUp(
		username: string,
		email: string,
		password: string
	): Promise<{ user: import('@supabase/supabase-js').User; profile: ProfileRow | null }> {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { username } }
		});
		if (error) throw error;

		const user = data.user;
		if (!user) throw new Error('Failed to create user');

		// wait for trig
		await new Promise((r) => setTimeout(r, 100));

		let profile: ProfileRow | null = null;
		try {
			// Check if we have a valid sessios
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData.session) {
				profile = await this.getByAuthId(user.id);
			}
		} catch (profileError) {
			console.warn('Could not fetch profile immediately after signup:', profileError);
		}

		return { user, profile };
	}

	static async signIn(email: string, password: string) {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw error;
		const user = data.user;
		if (!user) throw new Error('Failed to sign in');
		const profile = await this.getByAuthId(user.id);
		if (!profile) throw new Error('Profile not found');
		return { user, profile };
	}

	static async signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	}

	static async deleteAccount() {
		const { error } = await supabase.rpc('delete_user_account');
		if (error) throw error;
	}

	static async updateAllWormsStatus(status: 'private' | 'friends') {
		const profile = await this.getCurrentProfile();
		if (!profile) throw new Error('Not authenticated');

		const { error } = await supabase.from('worms').update({ status }).eq('author_id', profile.id);
		if (error) throw error;
	}
}
export default Profile;
