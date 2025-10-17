import { supabase } from '../supabase';

export type PublicProfileCard = {
	profile_id: number;
	username: string | null;
	badge_slug: string | null;
	badge_url: string | null;
};

export type FriendEdge = {
	a: string; // uuid (auth_id)
	b: string; // uuid (auth_id)
	requested_by: string;
	state: 'pending' | 'accepted' | 'declined' | 'blocked' | 'canceled';
	created_at: string;
	updated_at: string;
};

export type FriendWithUsername = {
	auth_id: string;
	username: string | null;
	created_at: string;
	edge: FriendEdge;
};

export class Friends {
	/* ---------------------------------- Card ---------------------------------- */

	static async getPublicCardByProfileId(id: number): Promise<PublicProfileCard | null> {
		const { data, error } = await supabase
			.from('public_profile_cards')
			.select('*')
			.eq('profile_id', id)
			.maybeSingle();
		if (error) throw error;
		return (data as PublicProfileCard) ?? null;
	}

	/* --------------------------------- UI Util -------------------------------- */

	static async listAccepted(): Promise<FriendEdge[]> {
		const { data, error } = await supabase
			.from('friend_edges')
			.select('*')
			.eq('state', 'accepted')
			.or('a.eq.' + (await this.me()) + ',b.eq.' + (await this.me()));
		if (error) throw error;
		return (data ?? []) as FriendEdge[];
	}

	static async listAcceptedWithUsernames(): Promise<FriendWithUsername[]> {
		const me = await this.me();
		const edges = await this.listAccepted();
		const friendsWithUsernames: FriendWithUsername[] = [];

		for (const edge of edges) {
			const friendAuthId = edge.a === me ? edge.b : edge.a;
			try {
				const { data, error } = await supabase
					.from('profiles')
					.select('username')
					.eq('auth_id', friendAuthId)
					.maybeSingle();

				if (error) {
					console.warn('Could not fetch username for friend:', friendAuthId, error);
				}

				friendsWithUsernames.push({
					auth_id: friendAuthId,
					username: data?.username || null,
					created_at: edge.created_at,
					edge
				});
			} catch (err) {
				console.warn('Error fetching friend username:', err);
				// idkj what to do here so just show the entry
				friendsWithUsernames.push({
					auth_id: friendAuthId,
					username: null,
					created_at: edge.created_at,
					edge
				});
			}
		}

		return friendsWithUsernames;
	}

	static async listIncoming(): Promise<FriendEdge[]> {
		const me = await this.me();
		const { data, error } = await supabase
			.from('friend_edges')
			.select('*')
			.eq('state', 'pending')
			.neq('requested_by', me)
			.or(`a.eq.${me},b.eq.${me}`);
		if (error) throw error;
		return (data ?? []) as FriendEdge[];
	}

	static async listOutgoing(): Promise<FriendEdge[]> {
		const me = await this.me();
		const { data, error } = await supabase
			.from('friend_edges')
			.select('*')
			.eq('state', 'pending')
			.eq('requested_by', me);
		if (error) throw error;
		return (data ?? []) as FriendEdge[];
	}

	/* --------------------------------- Actions -------------------------------- */

	static async request(otherAuthId: string) {
		const { data, error } = await supabase.rpc('friend_request', { target: otherAuthId });
		if (error) throw error;
		return data as FriendEdge;
	}

	static async accept(otherAuthId: string) {
		const { data, error } = await supabase.rpc('friend_accept', { other: otherAuthId });
		if (error) throw error;
		return data as FriendEdge;
	}

	static async decline(otherAuthId: string) {
		const { data, error } = await supabase.rpc('friend_decline', { other: otherAuthId });
		if (error) throw error;
		return data as FriendEdge;
	}

	static async remove(otherAuthId: string) {
		const { error } = await supabase.rpc('friend_remove', { _other: otherAuthId });
		if (error) throw error;
	}

	/* --------------------------------- Invites -------------------------------- */

	static async createInvite(ttlMinutes = 60) {
		const { data, error } = await supabase.rpc('friend_send_invite', { ttl_minutes: ttlMinutes });
		if (error) throw error;
		return data as { code: string; expires_at: string };
	}

	static async redeemInvite(code: string) {
		const { data, error } = await supabase.rpc('friend_redeem', { _code: code });
		if (error) throw error;
		return data as boolean;
	}

	static async searchByUsername(username: string): Promise<PublicProfileCard[]> {
		const { data, error } = await supabase
			.from('public_profile_cards')
			.select('*')
			.ilike('username', `%${username}%`)
			.limit(10);
		if (error) throw error;
		return (data ?? []) as PublicProfileCard[];
	}

	// util
	private static async me(): Promise<string> {
		const { data, error } = await supabase.auth.getUser();
		if (error) throw error;
		if (!data.user) throw new Error('Not authenticated');
		return data.user.id;
	}
}
