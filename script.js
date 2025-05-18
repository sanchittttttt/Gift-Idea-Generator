// Store favorites in localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function updateFavoritesDisplay() {
    const container = document.getElementById('favorites-container');
    if (favorites.length === 0) {
        container.innerHTML = 'No favorites yet';
        return;
    }

    container.innerHTML = favorites.map((idea, index) => `
        <div class="favorite-item">
            <div class="favorite-content">${idea}</div>
            <button class="remove-btn" onclick="removeFavorite(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function addFavorite(idea) {
    if (!favorites.includes(idea)) {
        favorites.push(idea);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesDisplay();
    }
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesDisplay();
}

async function generateIdea() {
    const occasion = document.getElementById("occasion").value.trim();
    const tags = document.getElementById("tags").value.trim();
    const output = document.querySelector(".ideas-container");
    const button = document.querySelector("button");

    // Input validation
    if (!occasion) {
        output.innerHTML = "<div class='gift-idea'><div class='gift-idea-content'>Please enter an occasion.</div></div>";
        return;
    }

    if (!tags) {
        output.innerHTML = "<div class='gift-idea'><div class='gift-idea-content'>Please enter at least one tag.</div></div>";
        return;
    }

    // Disable button and show loading state
    button.disabled = true;
    output.innerHTML = "<div class='gift-idea'><div class='gift-idea-content'>Thinking... 💭</div></div>";

    const prompt = `Generate 3 gift ideas for ${occasion} with these tags: ${tags}. Format each idea as a single line starting with "1.", "2.", "3.". Keep each idea to 1 short sentence.`;

    try {
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your-api-key-here') {
            throw new Error('API key not configured. Please check config.js');
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const ideas = data.choices?.[0]?.message?.content || "Couldn't generate ideas.";
        
        // Split the ideas into lines and format them
        const formattedIdeas = ideas
            .split('\n')
            .filter(line => line.trim() && line.match(/^\d\./))
            .map(line => {
                // Remove the number and dot from the start
                const idea = line.replace(/^\d\.\s*/, '');
                return `
                    <div class="gift-idea">
                        <div class="gift-idea-content">${idea.trim()}</div>
                        <button class="favorite-btn" onclick="addFavorite('${idea.trim().replace(/'/g, "\\'")}')">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                `;
            })
            .join('');
        
        output.innerHTML = formattedIdeas || "<div class='gift-idea'><div class='gift-idea-content'>Couldn't generate ideas.</div></div>";
    } catch (err) {
        console.error(err);
        output.innerHTML = `<div class="gift-idea"><div class="gift-idea-content">Error: ${err.message || "Something went wrong. Please try again."}</div></div>`;
    } finally {
        // Re-enable button
        button.disabled = false;
    }
}

// Initialize favorites display
updateFavoritesDisplay();
  