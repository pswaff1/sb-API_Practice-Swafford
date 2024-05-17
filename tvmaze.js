"use strict";
const MISSING_IMAGE = "https://tinyurl.com/tv-missing";

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term) {
	// Results array
	let results = [];

	// Get the stored shows from sessionStorage.
	let storedResults =
		JSON.parse(sessionStorage.getItem("shows")) || undefined;

	// If sessionStorage has no shows attribute, initialize with an empty array
	if (!storedResults) {
		storedResults = [];
		sessionStorage.setItem("shows", JSON.stringify([]));
	}

	// Checks sessionStorage for results and returns those results if found
	for (let storedResult of storedResults) {
		if (storedResult.term === term) {
			for (let shows of storedResult.data) {
				results.push([...shows]);
			}
		}
	}

	// No relevant results in sessionStorage, make API call
	if (results.length === 0) {
		// Makes API call to TVAPI to get results.
		const res = await $.get(`https://api.tvmaze.com/search/shows/?q=${term}`);

		// Invoke map function to condense results to only what is needed
		results.push(
			res.map((shows) => {
				// Destructure id, name, summary, and image from the API response
				const { id, name, summary, image } = shows.show;
				// Return an object with the destructored variables. If no image, placeholder is used.
				return {
					id,
					name,
					summary,
					image: image ? image.medium : MISSING_IMAGE,
				};
			})
		);
		storedResults.push({ term: term, data: [...results] });

		// Saves the results to sessionStorage
		sessionStorage.setItem("shows", JSON.stringify([...storedResults]));
	}
	// Returns the results array
	return results;
}

/** Given list of shows, create markup for each and to DOM */

function populateShows(termResults) {
	$showsList.empty();

	for (let shows of termResults) {
		for (let show of shows) {
			const { id, name, summary, image } = show;
			const $show = $(
				`<div data-show-id="${id}"
                class=" Show 
                        col-md-12 
                        col-lg-6 
                        mb-4">
                <div class="media">
                    <img
                        src="${image}"
                        alt="${name}"
                        class="w-25 me-3">
                        <div class="media-body">
                            <h5 class="text-primary">${name}</h5>
                            <div><small>${summary}</small></div>
                            <button class="btn btn-outline-light btn-sm Show-getEpisodes">
                                Episodes
                            </button>
                        </div>
                </div>
            </div>`
			);

			$showsList.append($show);
		}
	}
}

/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
	const term = $("#searchForm-term").val();
	const shows = await getShowsByTerm(term);

	$episodesArea.hide();
	populateShows(shows);
}

// Event Listener attached to the Search Form
$searchForm.on("submit", async function (evt) {
	evt.preventDefault();
	await searchForShowAndDisplay();
});

/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id) {
    const results = [];
	const $res = await $.get(`https://api.tvmaze.com/shows/${id}/episodes`);
	for (let episode of $res) {
        const { id, name, season, number } = episode;
        results.push({
            id,
            name,
            season,
            number
        });
    }
    return results;
}

/** Write a clear docstring for this function... */

function populateEpisodes(episodes) {
    $episodesList.empty();

    for (let episode of episodes) {
        const {id, name, season, number } = episode;

        const $newEpisode = $(
            `<li>${name} (season ${season}, episode ${number}</li>`
        )

        $episodesList.append($newEpisode);

        
    }


}

// Event Listener attached to the Episode List
$showsList.on("click", ".Show-getEpisodes", async (e) => {
	// Get the Movie API show ID
	const id = $(e.target).closest(".Show").data("show-id");

	// Get the episode List
	let results = await getEpisodesOfShow(id);
    populateEpisodes(results);
    $episodesArea.show();
});
