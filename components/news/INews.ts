export interface INews {
	id: string;
	date: string;
	language: string
	title: string;
	content: string;
	excerpt: string;
	image: {
		// there are more fields here, these are just the ones we might use
		width: number,
		height: number,
		filename_disk: string;
		data: {
			full_url: string;
			url: string;
		}
	} | null;
}
