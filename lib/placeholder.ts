import type {
  Movie,
  Series,
  Season,
  MediaCard,
  OnboardingTitle,
  RecommendationReason,
} from '@/src/types/media';

// --- Real TMDB paths (CDN is public). If any 404, next/image fails gracefully. ---

export const parasite: Movie = {
  id: 496243,
  title: 'Parasite',
  release_year: 2019,
  release_date: '2019-05-30',
  runtime: 132,
  rating: 'R',
  vote_average: 8.5,
  vote_count: 17900,
  overview:
    'All unemployed, Ki-taek’s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.',
  poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  backdrop_path: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
  genres: [
    { id: 35, name: 'Comedy' },
    { id: 53, name: 'Thriller' },
    { id: 18, name: 'Drama' },
  ],
  keywords: [
    { id: 1, name: 'slow-burn' },
    { id: 2, name: 'social class' },
    { id: 3, name: 'unreliable narrator' },
    { id: 4, name: 'dark comedy' },
    { id: 5, name: 'thriller' },
  ],
  cast: [
    { id: 1, name: 'Song Kang-ho', character: 'Kim Ki-taek', profile_path: '/dr2u0bvgSnPmkD6PsQKMQhMrA9z.jpg', order: 0 },
    { id: 2, name: 'Lee Sun-kyun', character: 'Park Dong-ik', profile_path: '/8jJOJEEpDLM6sOoeyrrh3F4nkOM.jpg', order: 1 },
    { id: 3, name: 'Cho Yeo-jeong', character: 'Choi Yeon-gyo', profile_path: '/2VkTQwkqyOwQ4ULRDIShEYR59Cn.jpg', order: 2 },
    { id: 4, name: 'Choi Woo-shik', character: 'Kim Ki-woo', profile_path: '/dN73t1n7B7zycHk2QbZS92n2qFD.jpg', order: 3 },
    { id: 5, name: 'Park So-dam', character: 'Kim Ki-jung', profile_path: '/zBdMMmuFqvGDLwZJ8eDHv4y7n7Q.jpg', order: 4 },
    { id: 6, name: 'Jang Hye-jin', character: 'Chung-sook', order: 5 },
    { id: 7, name: 'Lee Jung-eun', character: 'Moon-gwang', order: 6 },
    { id: 8, name: 'Park Myung-hoon', character: 'Geun-sae', order: 7 },
  ],
  similar: [], // filled below
};

const memoriesOfMurder: Movie = {
  id: 11423,
  title: 'Memories of Murder',
  release_year: 2003,
  release_date: '2003-04-25',
  runtime: 131,
  rating: 'R',
  vote_average: 8.1,
  vote_count: 2700,
  overview:
    'In a small Korean province in 1986, two detectives struggle with the case of multiple young women being found raped and murdered by an unknown culprit.',
  poster_path: '/74gE8YyApcoUKj4tFPmuTBlAOPK.jpg',
  backdrop_path: '/srGy65EpFp2Fnp1jpVRWWVF4Vox.jpg',
  genres: [
    { id: 80, name: 'Crime' },
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  keywords: [
    { id: 1, name: 'slow-burn' },
    { id: 5, name: 'serial killer' },
    { id: 6, name: 'detective' },
  ],
  cast: [],
};

const oldboy: Movie = {
  id: 670,
  title: 'Oldboy',
  release_year: 2003,
  release_date: '2003-11-21',
  runtime: 120,
  rating: 'R',
  vote_average: 8.3,
  vote_count: 5500,
  overview:
    'With no clue how he came to be imprisoned, drugged and tortured for 15 years, a desperate businessman seeks vengeance on his captors.',
  poster_path: '/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg',
  backdrop_path: '/lY44J56FpAdmrjOZeC0HKMqgQEU.jpg',
  genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
  keywords: [{ id: 7, name: 'revenge' }, { id: 8, name: 'twist ending' }],
  cast: [],
};

const burning: Movie = {
  id: 491584,
  title: 'Burning',
  release_year: 2018,
  release_date: '2018-05-17',
  runtime: 148,
  rating: 'R',
  vote_average: 7.5,
  vote_count: 1600,
  overview:
    'A deliveryman named Jongsu bumps into Haemi, who used to live in his neighborhood. She asks if he can take care of her cat while she goes on a trip to Africa.',
  poster_path: '/sgRfYHl4SHTakLBuSjexbqXFy1z.jpg',
  backdrop_path: '/4hjkdz4eRfXdmqcGYi2gw5GbWmA.jpg',
  genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }],
  keywords: [{ id: 1, name: 'slow-burn' }, { id: 3, name: 'unreliable narrator' }],
  cast: [],
};

const theHandmaiden: Movie = {
  id: 290098,
  title: 'The Handmaiden',
  release_year: 2016,
  release_date: '2016-06-01',
  runtime: 145,
  rating: 'NR',
  vote_average: 8.1,
  vote_count: 3400,
  overview:
    'Korea, 1930s. Sookee is hired as a handmaiden to a Japanese heiress, Hideko, who lives a secluded life on a large countryside estate.',
  poster_path: '/9XCsHC03ZbjzMxRSWDdcdN7s5RJ.jpg',
  backdrop_path: '/3GpoO5rmnUuhz0LU5GTpYbAFvUe.jpg',
  genres: [{ id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }],
  keywords: [{ id: 8, name: 'twist ending' }, { id: 9, name: 'period' }],
  cast: [],
};

const drive: Movie = {
  id: 64690,
  title: 'Drive',
  release_year: 2011,
  release_date: '2011-09-15',
  runtime: 100,
  rating: 'R',
  vote_average: 7.8,
  vote_count: 13000,
  overview:
    'Driver is a skilled Hollywood stuntman who moonlights as a getaway driver for criminals. Though he projects an icy exterior, lately he\'s been warming up to a pretty neighbor.',
  poster_path: '/602vevIURmpDfzbnv5Ubi6wIkQm.jpg',
  backdrop_path: '/bcS3qOXdSjQ3LMA8AKEh2Rqn7AT.jpg',
  genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }],
  keywords: [{ id: 1, name: 'slow-burn' }, { id: 10, name: 'neo-noir' }],
  cast: [],
};

const noCountry: Movie = {
  id: 6977,
  title: 'No Country for Old Men',
  release_year: 2007,
  release_date: '2007-11-08',
  runtime: 122,
  rating: 'R',
  vote_average: 8.0,
  vote_count: 10800,
  overview:
    'Llewelyn Moss stumbles upon dead bodies, $2 million and a hoard of heroin in a Texas desert, but methodical killer Anton Chigurh comes looking for it.',
  poster_path: '/6d5XOczcyfqIDjBwzfH8FlweOdc.jpg',
  backdrop_path: '/wBlszWWE9nWh8Xb1jbBSY7DZwHv.jpg',
  genres: [{ id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
  keywords: [{ id: 11, name: 'hitman' }, { id: 12, name: 'desert' }],
  cast: [],
};

const mulhollandDrive: Movie = {
  id: 1018,
  title: 'Mulholland Drive',
  release_year: 2001,
  release_date: '2001-05-16',
  runtime: 146,
  rating: 'R',
  vote_average: 7.9,
  vote_count: 4800,
  overview:
    'After a car wreck on the winding Mulholland Drive renders a woman amnesiac, she and a perky Hollywood-hopeful search for clues and answers across Los Angeles in a twisting maze.',
  poster_path: '/x7QrYYCtypFvKvKnT93FwbsfXC5.jpg',
  backdrop_path: '/8e7d5KKxfwjEcD5GqZqGUFGwkF.jpg',
  genres: [{ id: 9648, name: 'Mystery' }, { id: 53, name: 'Thriller' }, { id: 18, name: 'Drama' }],
  keywords: [{ id: 3, name: 'unreliable narrator' }, { id: 13, name: 'surreal' }],
  cast: [],
};

const theLighthouse: Movie = {
  id: 503919,
  title: 'The Lighthouse',
  release_year: 2019,
  release_date: '2019-10-18',
  runtime: 109,
  rating: 'R',
  vote_average: 7.4,
  vote_count: 5700,
  overview:
    'Two lighthouse keepers try to maintain their sanity while living on a remote and mysterious New England island in the 1890s.',
  poster_path: '/6oCfYqYHM5ROx7uDjT6L9I8mtPa.jpg',
  backdrop_path: '/uIpJPvocgRk6JeEKCB1Tk5xXCs5.jpg',
  genres: [{ id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' }],
  keywords: [{ id: 14, name: 'isolation' }, { id: 13, name: 'surreal' }],
  cast: [],
};

const hereditary: Movie = {
  id: 493922,
  title: 'Hereditary',
  release_year: 2018,
  release_date: '2018-06-07',
  runtime: 127,
  rating: 'R',
  vote_average: 7.3,
  vote_count: 7200,
  overview:
    'When the matriarch of the Graham family passes away, her daughter\'s family begins to unravel cryptic and increasingly terrifying secrets about their ancestry.',
  poster_path: '/p81d6QF60GH8KZbBkz77JlF1mDC.jpg',
  backdrop_path: '/3VTJYwgvKkVoYUkAm6gB1bWyGEX.jpg',
  genres: [{ id: 27, name: 'Horror' }, { id: 9648, name: 'Mystery' }, { id: 53, name: 'Thriller' }],
  keywords: [{ id: 15, name: 'family' }, { id: 1, name: 'slow-burn' }],
  cast: [],
};

const theWitch: Movie = {
  id: 310131,
  title: 'The Witch',
  release_year: 2015,
  release_date: '2015-01-22',
  runtime: 92,
  rating: 'R',
  vote_average: 6.9,
  vote_count: 4900,
  overview:
    'In 1630s New England, a Puritan family encounters forces of evil in the woods beyond their farm.',
  poster_path: '/zap5BaIv8FFwUskwzNXcvX7VHM4.jpg',
  backdrop_path: '/9aQGCnSjxnNxsf3R2VgCbqJ0LqU.jpg',
  genres: [{ id: 27, name: 'Horror' }, { id: 9648, name: 'Mystery' }],
  keywords: [{ id: 9, name: 'period' }, { id: 16, name: 'folk horror' }],
  cast: [],
};

const zodiac: Movie = {
  id: 1949,
  title: 'Zodiac',
  release_year: 2007,
  release_date: '2007-03-02',
  runtime: 157,
  rating: 'R',
  vote_average: 7.7,
  vote_count: 6700,
  overview:
    'The true story of the investigation of the "Zodiac Killer," a serial killer who terrorized the San Francisco Bay Area, taunting police with his ciphers and letters.',
  poster_path: '/8uOhEMzgZUyUblWvuJ3JoNXkz9Q.jpg',
  backdrop_path: '/yLZJSx5j2BncSmDtgwxSdo1aw1F.jpg',
  genres: [{ id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
  keywords: [{ id: 1, name: 'slow-burn' }, { id: 6, name: 'detective' }],
  cast: [],
};

const sinners: Movie = {
  id: 1233413,
  title: 'Sinners',
  release_year: 2025,
  release_date: '2025-04-18',
  runtime: 137,
  rating: 'R',
  vote_average: 7.6,
  vote_count: 1200,
  overview:
    'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.',
  poster_path: '/yqsBoLG5fSPbJB6n8diSE0idQ43.jpg',
  backdrop_path: '/5MdpcRYrTeNYAtAVlbnY7Tx0gmK.jpg',
  genres: [{ id: 27, name: 'Horror' }, { id: 18, name: 'Drama' }],
  keywords: [{ id: 9, name: 'period' }, { id: 17, name: 'vampire' }],
  cast: [],
};

const anatomyOfAFall: Movie = {
  id: 915935,
  title: 'Anatomy of a Fall',
  release_year: 2023,
  release_date: '2023-08-23',
  runtime: 152,
  rating: 'R',
  vote_average: 7.7,
  vote_count: 3100,
  overview:
    'A woman is suspected of her husband\'s murder, and their blind son faces a moral dilemma as the sole witness.',
  poster_path: '/kQs6keheMwCxJxrzV83VUwFtHkB.jpg',
  backdrop_path: '/dKqa850uvbNSCaQCV4Im1XlzEtQ.jpg',
  genres: [{ id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }],
  keywords: [{ id: 1, name: 'slow-burn' }, { id: 6, name: 'detective' }],
  cast: [],
};

parasite.similar = [memoriesOfMurder, oldboy, burning, theHandmaiden, drive, noCountry, mulhollandDrive, theLighthouse];

// --- Severance Series + Season 2 ---

export const severance: Series = {
  id: 95396,
  name: 'Severance',
  release_year: 2022,
  overview:
    'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth.',
  poster_path: '/lXLDfdK37iIM7XK91Pzg2mWBh1g.jpg',
  backdrop_path: '/eRMRTOqJSE2D9pTaaIfqQNYdLcL.jpg',
  rating: 'TV-MA',
  vote_average: 8.4,
  vote_count: 3200,
  genres: [{ id: 9648, name: 'Mystery' }, { id: 18, name: 'Drama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }],
  keywords: [
    { id: 18, name: 'corporate dystopia' },
    { id: 3, name: 'unreliable narrator' },
    { id: 1, name: 'slow-burn' },
    { id: 19, name: 'memory' },
  ],
  cast: [
    { id: 101, name: 'Adam Scott', character: 'Mark Scout', profile_path: '/p1Xfb2y6r6mE0RnpFsFOpkVuosj.jpg', order: 0 },
    { id: 102, name: 'Britt Lower', character: 'Helly R.', profile_path: '/oXNfNzlGGZyURUPYpzWdpfkfwLF.jpg', order: 1 },
    { id: 103, name: 'Zach Cherry', character: 'Dylan G.', order: 2 },
    { id: 104, name: 'John Turturro', character: 'Irving B.', order: 3 },
    { id: 105, name: 'Patricia Arquette', character: 'Harmony Cobel', order: 4 },
    { id: 106, name: 'Tramell Tillman', character: 'Seth Milchick', order: 5 },
    { id: 107, name: 'Christopher Walken', character: 'Burt G.', order: 6 },
  ],
  seasons: [
    { id: 119835, season_number: 1, name: 'Season 1', episode_count: 9, air_date: '2022-02-18', poster_path: '/iOoz7VlSlc5wQjGB6BDvJoTAxRm.jpg' },
    { id: 360075, season_number: 2, name: 'Season 2', episode_count: 10, air_date: '2025-01-17', poster_path: '/4tUuY6gXBxbtu39yORjeWLZpUjr.jpg' },
  ],
};

export const severance_s2: Season = {
  id: 360075,
  season_number: 2,
  name: 'Season 2',
  overview:
    'Mark and his fellow Macrodata Refinement team members are confronted with the ramifications of pulling back the curtain on Lumon Industries, as the boundaries between their innie and outie lives begin to blur.',
  poster_path: '/4tUuY6gXBxbtu39yORjeWLZpUjr.jpg',
  backdrop_path: '/eRMRTOqJSE2D9pTaaIfqQNYdLcL.jpg',
  air_date: '2025-01-17',
  episode_count: 10,
  avg_runtime: 55,
  series_id: 95396,
  series_name: 'Severance',
  cast: severance.cast,
  episodes: [
    { id: 4854430, episode_number: 1, name: 'Hello, Ms. Cobel', overview: 'A wellness check uncovers familiar faces — and unexpected absences.', air_date: '2025-01-17', runtime: 56, still_path: '/jw0KXr8d9rGSk62gAGsCJoXokc1.jpg', watched: true },
    { id: 4854431, episode_number: 2, name: 'Goodbye, Mrs. Selvig', overview: 'An offer is made. Mark has a conversation he is unprepared for.', air_date: '2025-01-24', runtime: 52, still_path: '/m9zCnHzZB8mRPP2RJYHJrYpw14p.jpg', watched: true },
    { id: 4854432, episode_number: 3, name: 'Who Is Alive?', overview: 'A team-building exercise goes off the rails. Cobel is restless.', air_date: '2025-01-31', runtime: 55, still_path: '/9wD7H7Eyk62b8GVE5gV5HsTHRsP.jpg', watched: true },
    { id: 4854433, episode_number: 4, name: 'Woe\'s Hollow', overview: 'A retreat at the company\'s rural property surfaces new fractures.', air_date: '2025-02-07', runtime: 64, still_path: '/8ROsORlNz5xMzC2hCDb1m8KQ7eO.jpg' },
    { id: 4854434, episode_number: 5, name: 'Trojan\'s Horse', overview: 'Mark searches for someone who may not want to be found.', air_date: '2025-02-14', runtime: 52 },
    { id: 4854435, episode_number: 6, name: 'Attila', overview: 'Irving follows a hunch. Helly faces a choice.', air_date: '2025-02-21', runtime: 50 },
    { id: 4854436, episode_number: 7, name: 'Chikhai Bardo', overview: 'A memory surfaces, more vivid than the rest.', air_date: '2025-02-28', runtime: 57 },
    { id: 4854437, episode_number: 8, name: 'Sweet Vitriol', overview: 'A long-buried truth begins to emerge.', air_date: '2025-03-07', runtime: 51 },
    { id: 4854438, episode_number: 9, name: 'The After Hours', overview: 'The outies and innies are forced into a confrontation.', air_date: '2025-03-14', runtime: 58 },
    { id: 4854439, episode_number: 10, name: 'Cold Harbor', overview: 'A door is opened. Nothing will be the same.', air_date: '2025-03-21', runtime: 76 },
  ],
};

// --- Card collections for the feed surfaces ---

function toCard(m: Movie, status?: MediaCard['status']): MediaCard {
  return {
    id: m.id,
    title: m.title,
    release_year: m.release_year,
    poster_path: m.poster_path,
    vote_average: m.vote_average,
    overview: m.overview,
    type: 'movie',
    status,
  };
}

function seriesCard(s: Series, status?: MediaCard['status']): MediaCard {
  return {
    id: s.id,
    name: s.name,
    release_year: s.release_year,
    poster_path: s.poster_path,
    vote_average: s.vote_average,
    overview: s.overview,
    type: 'tv',
    status,
  };
}

export const continueWatching: MediaCard[] = [
  seriesCard(severance, 'watching'),
];

export const becauseYouLikedParasite: MediaCard[] = [
  toCard(memoriesOfMurder),
  toCard(oldboy),
  toCard(burning),
  toCard(theHandmaiden),
  toCard(anatomyOfAFall),
  toCard(zodiac),
];

export const newToYou: MediaCard[] = [
  toCard(sinners),
  toCard(anatomyOfAFall),
  toCard(theLighthouse),
  toCard(hereditary),
  toCard(theWitch),
  toCard(drive),
];

export const slowBurnThrillers: MediaCard[] = [
  toCard(memoriesOfMurder),
  toCard(zodiac),
  toCard(burning),
  toCard(drive),
  toCard(noCountry),
  toCard(parasite),
];

export const trendingSearches = [
  'Severance',
  'Sinners',
  'Anatomy of a Fall',
  'Slow-burn thrillers',
  'Bong Joon-ho',
];

export const recentSearches = [
  'Parasite',
  'Mulholland Drive',
  'The Handmaiden',
];

// All movies, used as the catalog for search etc.
export const allMovies = [
  parasite,
  memoriesOfMurder,
  oldboy,
  burning,
  theHandmaiden,
  drive,
  noCountry,
  mulhollandDrive,
  theLighthouse,
  hereditary,
  theWitch,
  zodiac,
  sinners,
  anatomyOfAFall,
];

export const feed: MediaCard[] = [
  toCard(parasite),
  seriesCard(severance, 'watching'),
  toCard(sinners),
  toCard(anatomyOfAFall),
  toCard(memoriesOfMurder),
  toCard(burning),
  toCard(theHandmaiden),
  toCard(zodiac),
  toCard(theLighthouse),
  toCard(hereditary),
  toCard(theWitch),
  toCard(drive),
  toCard(noCountry),
  toCard(mulhollandDrive),
  toCard(oldboy),
];

// --- Library / watchlist seed (assign stable statuses for the tabs) ---

const STATUSES: NonNullable<MediaCard['status']>[] = [
  'planning',
  'watching',
  'completed',
  'paused',
  'dropped',
  'rewatching',
];

export const libraryItems: MediaCard[] = feed.map((c, i) => ({
  ...c,
  status: STATUSES[i % STATUSES.length],
  userRating: i % 3 === 0 ? 5 : i % 4 === 0 ? 4 : i % 5 === 0 ? 3 : undefined,
}));

// --- Onboarding ---

export const onboardingTitles: OnboardingTitle[] = [
  { id: 496243, title: 'Parasite', year: 2019, poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', type: 'movie' },
  { id: 11423, title: 'Memories of Murder', year: 2003, poster_path: '/74gE8YyApcoUKj4tFPmuTBlAOPK.jpg', type: 'movie' },
  { id: 670, title: 'Oldboy', year: 2003, poster_path: '/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg', type: 'movie' },
  { id: 491584, title: 'Burning', year: 2018, poster_path: '/sgRfYHl4SHTakLBuSjexbqXFy1z.jpg', type: 'movie' },
  { id: 290098, title: 'The Handmaiden', year: 2016, poster_path: '/9XCsHC03ZbjzMxRSWDdcdN7s5RJ.jpg', type: 'movie' },
  { id: 64690, title: 'Drive', year: 2011, poster_path: '/602vevIURmpDfzbnv5Ubi6wIkQm.jpg', type: 'movie' },
  { id: 6977, title: 'No Country for Old Men', year: 2007, poster_path: '/6d5XOczcyfqIDjBwzfH8FlweOdc.jpg', type: 'movie' },
  { id: 503919, title: 'The Lighthouse', year: 2019, poster_path: '/6oCfYqYHM5ROx7uDjT6L9I8mtPa.jpg', type: 'movie' },
  { id: 95396, title: 'Severance', year: 2022, poster_path: '/lXLDfdK37iIM7XK91Pzg2mWBh1g.jpg', type: 'tv' },
  { id: 1949, title: 'Zodiac', year: 2007, poster_path: '/8uOhEMzgZUyUblWvuJ3JoNXkz9Q.jpg', type: 'movie' },
];

// --- Recommendation reason example ---

export const sampleReason: RecommendationReason = {
  headline: 'Because you liked Memories of Murder and rate slow-burn thrillers highly.',
  basedOn: { id: 11423, title: 'Memories of Murder' },
  matchedKeywords: ['slow-burn', 'unreliable narrator', 'social class'],
  matchStrength: 87,
};
