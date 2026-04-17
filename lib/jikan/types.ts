export interface JikanImageSet {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface JikanImages {
  jpg: JikanImageSet;
  webp: JikanImageSet;
}

export interface JikanAnimeListItem {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: JikanImages;
  synopsis: string | null;
  year: number | null;
}

export interface JikanCharacter {
  character: {
    mal_id: number;
    name: string;
    images: JikanImages;
  };
  role: string;
}

export interface JikanAnimeFull extends JikanAnimeListItem {
  score: number | null;
  rank: number | null;
  popularity: number | null;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
}

export interface JikanResponse<T> {
  data: T;
  pagination?: JikanPagination;
}
