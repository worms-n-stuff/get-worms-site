import { supabase } from '../supabase';

export type Worm = {
	id: number;
	created_at: string;
	updated_at: string | null;
	content: string;
	status: 'private' | 'friends' | 'public';
	tags: string[] | null;
	author_id: number; // bigint (profiles.id)
	position: Record<string, unknown> | null;
	host_url: string;
};

export class Worms {
	static async create(input: Omit<Worm, 'id' | 'created_at' | 'updated_at'>) {
		const { data, error } = await supabase.from('worms').insert(input).select('*').maybeSingle();
		if (error) throw error;
		return data as Worm;
	}

	static async update(id: number, patch: Partial<Worm>) {
		const { data, error } = await supabase
			.from('worms')
			.update(patch)
			.eq('id', id)
			.select('*')
			.maybeSingle();
		if (error) throw error;
		return data as Worm;
	}

	static async listVisible(limit = 50) {
		const { data, error } = await supabase
			.from('worms')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(limit);
		if (error) throw error;
		return (data ?? []) as Worm[];
	}

	static async byAuthorProfileId(profileId: number, limit = 50) {
		const { data, error } = await supabase
			.from('worms')
			.select('*')
			.eq('author_id', profileId)
			.order('created_at', { ascending: false })
			.limit(limit);
		if (error) throw error;
		return (data ?? []) as Worm[];
	}

	static async delete(id: number) {
		const { error } = await supabase.from('worms').delete().eq('id', id);
		if (error) throw error;
	}

	static async updateStatus(id: number, status: 'private' | 'friends' | 'public') {
		const { data, error } = await supabase
			.from('worms')
			.update({ status })
			.eq('id', id)
			.select('*')
			.maybeSingle();
		if (error) throw error;
		return data as Worm;
	}
}
