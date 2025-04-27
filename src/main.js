import axios from "axios";

const API_KEY = "";
const BASE_URL = `https://www.omdbapi.com/?apikey=${API_KEY}&s=`;

const root = document.querySelector(`#root`);

const getData = (key) => {
    return JSON.parse(localStorage.getItem(key)) || [];
}

const saveData = (arr, value, key) => {
    if (arr.length < 5) {
        arr.unshift(value);
        localStorage.setItem(key, JSON.stringify(arr));
    } else {
        arr.unshift(value);
        arr.pop();
        localStorage.setItem(key, JSON.stringify(arr));
    }
}

const setData = (key, value) => {
    let data = getData(key) || [];
    if (data.includes(value)) {
        data = data.filter((item) => item !== value);
        saveData(data, value, key);
    } else {
        saveData(data, value, key);
    }
}

const store = {
    films: [],
    isStatus: false,
    firstLoad: true,
    currentFilm: {}
}

const loadFilms = async (film) => {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000)

        store.isStatus = false;
        outDisplayFilms();

        const response = await axios.get(`${BASE_URL}${encodeURIComponent(film)}`);
        store.films = response.data?.Search || [];
        store.isStatus = true;

        const MAX_ITEMS = 100; // Для бесплатного API
        const totalItems = Math.min(parseInt(response.data.totalResults) || 0, MAX_ITEMS);
        const totalPages = Math.ceil(totalItems / 10);

        outDisplayFilms(totalPages, 1);
    } catch (error) {
        store.isStatus = false;
        if (error.response) {
            console.error("Ощибка: " + error.response.status);
        } else if (error.request) {
            console.error("Нет ответа");
        } else if (error.name === "AbortError") {
            console.error("Время запроса было превышено");
        } else {
            console.error(error.message);
        }
    }
}

const loadFullFilm = async (imdbID) => {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000)

        const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`, {signal: controller.signal});
        store.currentFilm = response.data;
    } catch (error) {
        if (error.response) {
            console.error("Ощибка: " + error.response.status);
        } else if (error.request) {
            console.error("Нет ответа");
        } else if (error.name === "AbortError") {
            console.error("Время запроса было превышено");
        } else {
            console.error(error.message);
        }
    }
}

const createCard = ({imdbID, Poster, Title, Year}) => {

    const card = document.createElement('div');
    card.className = "film";
    card.dataset.id = imdbID;

    const imgContainer = document.createElement('div');
    imgContainer.className = "image-container";

    const imageCard = document.createElement('img');
    imageCard.className = "image-card";
    imageCard.src = Poster;

    const footerCard = document.createElement('div');
    footerCard.className = "footer-card";

    const titleFilm = document.createElement('h3');
    titleFilm.className = "title-film";
    titleFilm.textContent = Title;

    const yearFilm = document.createElement('span');
    yearFilm.className = "year-film";
    yearFilm.textContent = Year;

    card.append(imgContainer);
    card.append(footerCard);
    imgContainer.append(imageCard);
    footerCard.append(titleFilm);
    footerCard.append(yearFilm);

    return card;
}

const createHistorySearchItem = (searchValue) => {
    const historyItem = document.createElement('div');
    historyItem.className = "history-search-item";
    historyItem.textContent = searchValue;

    return historyItem;
}

const createEmptyFilms = () => {
    const emptyFilms = document.createElement("p");
    emptyFilms.className = "empty-films"
    emptyFilms.textContent = "Фильмов с таким названием нет";

    return emptyFilms;
}

const createLoader = () => {
    const loader = document.createElement("div");
    loader.className = "loader";

    return loader;
}

const createPagination = (totalPages, currentPage = 1) => {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';

    const MAX_PAGES = 10;
    const pagesToShow = Math.min(totalPages, MAX_PAGES);

    const startPage = Math.max(1, Math.min(
        currentPage - 2,
        pagesToShow - 4
    ));

    const endPage = Math.min(
        pagesToShow,
        Math.max(5, currentPage + 2)
    );

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => loadPage(currentPage - 1));
    paginationContainer.appendChild(prevButton);

    if (startPage > 1) {
        const button = document.createElement('button');
        button.textContent = 1;
        button.addEventListener('click', () => loadPage(1));
        paginationContainer.appendChild(button);
        paginationContainer.appendChild(document.createTextNode('...'));
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.toggle('active', i === currentPage);
        button.addEventListener('click', () => loadPage(i));
        paginationContainer.appendChild(button);
    }

    if (endPage < pagesToShow) {
        paginationContainer.appendChild(document.createTextNode('...'));
        const button = document.createElement('button');
        button.textContent = pagesToShow;
        button.addEventListener('click', () => loadPage(pagesToShow));
        paginationContainer.appendChild(button);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = currentPage === pagesToShow;
    nextButton.addEventListener('click', () => loadPage(currentPage + 1));
    paginationContainer.appendChild(nextButton);

    return paginationContainer;
};

const loadPage = async (pageNumber) => {
    const titleFilm = getData("search")[0];
    try {
        store.isStatus = false;
        outDisplayFilms();

        const response = await axios.get(`${BASE_URL}${encodeURIComponent(titleFilm)}&page=${pageNumber}`);
        store.films = response.data?.Search || [];
        store.isStatus = true;

        const MAX_ITEMS = 100;
        const totalItems = Math.min(parseInt(response.data.totalResults) || 0, MAX_ITEMS);
        const totalPages = Math.ceil(totalItems / 10);

        outDisplayFilms(totalPages, pageNumber);
    } catch (error) {
        console.error('Ошибка пагинации:', error);
    }
};

const createModalFilmWindow = ({
                                   Title,
                                   Year,
                                   Poster,
                                   Plot,
                                   Released,
                                   Runtime,
                                   Genre,
                                   Director,
                                   Actors,
                                   Language,
                                   Country,
                               }) => {
    const modalWindow = document.createElement('dialog');
    modalWindow.className = "modal-window";

    const modalContent = document.createElement('div');
    modalContent.className = "modal-content";

    const modalImage = document.createElement('img');
    modalImage.className = "modal-image";
    modalImage.src = Poster;
    modalContent.appendChild(modalImage);

    const madalText = document.createElement('div');
    madalText.className = "modal-text";
    modalContent.appendChild(madalText);

    const modalTitle = document.createElement('h2');
    modalTitle.className = "modal-title";
    modalTitle.textContent = `Название: ${Title}`;
    madalText.appendChild(modalTitle);

    const modalYear = document.createElement('p');
    modalYear.className = "modal-year";
    modalYear.textContent = `Год: ${Year}`;
    madalText.appendChild(modalYear);

    const modalPlot = document.createElement('p');
    modalPlot.className = "modal-plot";
    modalPlot.textContent = `Описание: ${Plot}`;
    madalText.appendChild(modalPlot);

    const modalReleased = document.createElement('p');
    modalReleased.className = "modal-released";
    modalReleased.textContent = `Дата выхода: ${Released}`;
    madalText.appendChild(modalReleased);

    const modalRuntime = document.createElement('p');
    modalRuntime.className = "modal-runtime";
    modalRuntime.textContent = `Длительность: ${Runtime}`;
    madalText.appendChild(modalRuntime);

    const modalGenre = document.createElement('p');
    modalGenre.className = "modal-genre";
    modalGenre.textContent = `Жанр: ${Genre}`;
    madalText.appendChild(modalGenre);

    const modalDirector = document.createElement('p');
    modalDirector.className = "modal-director";
    modalDirector.textContent = `Режиссер: ${Director}`;
    madalText.appendChild(modalDirector);

    const modalActors = document.createElement('p');
    modalActors.className = "modal-actors";
    modalActors.textContent = `Актеры: ${Actors}`;
    madalText.appendChild(modalActors);

    const modalLanguage = document.createElement('p');
    modalLanguage.className = "modal-language";
    modalLanguage.textContent = `Язык: ${Language}`;
    madalText.appendChild(modalLanguage);

    const modalCountry = document.createElement('p');
    modalCountry.className = "modal-country";
    modalCountry.textContent = `Страна: ${Country}`;
    madalText.appendChild(modalCountry);

    const closeButton = document.createElement('button');
    closeButton.className = "close-button";
    closeButton.textContent = "X";
    closeButton.addEventListener('click', () => {
        modalWindow.close();
    });

    modalWindow.appendChild(closeButton);
    modalWindow.appendChild(modalContent);

    return modalWindow;
}

const outDisplayFilms = (totalPages = 1, currentPage = 1) => {
    const historySearch = document.querySelector(`#history-search`);
    const filmsList = document.querySelector(`#films`);
    const paginationContainer = document.querySelector(`#pagination-container`);

    historySearch.innerHTML = '';
    filmsList.innerHTML = '';
    paginationContainer.innerHTML = '';

    getData("search").forEach(value => {
        historySearch.appendChild(createHistorySearchItem(value));
    });

    if (store.isStatus) {
        if (store.films.length) {
            store.films.forEach(film => {
                filmsList.appendChild(createCard(film));
            });

            paginationContainer.appendChild(createPagination(totalPages, currentPage));
        } else {
            filmsList.appendChild(createEmptyFilms());
        }
    } else {
        if (!store.firstLoad) {
            filmsList.appendChild(createLoader());
        }
    }
}

window.addEventListener(`load`, () => {
    outDisplayFilms();
    store.firstLoad = false;
})

root.addEventListener(`submit`, async (event) => {
    if (event.target.classList.contains(`search-form`)) {
        event.preventDefault();

        const titleFilm = document.querySelector(`#search`).value.trim().toLowerCase();

        setData("search", titleFilm)
        await loadFilms(titleFilm);
    }
})

root.addEventListener(`click`, async (event) => {
    if (event.target.classList.contains(`history-search-item`)) {
        const titleFilm = event.target.textContent.trim().toLowerCase();
        document.querySelector(`#search`).value = titleFilm;
        setData("search", titleFilm)
        await loadFilms(titleFilm);
    }

    const filmCard = event.target.closest('.film');

    if (filmCard) {
        const imdbID = filmCard.dataset.id;
        await loadFullFilm(imdbID);
        const modalWindow = createModalFilmWindow(store.currentFilm);
        document.body.appendChild(modalWindow);
        modalWindow.showModal();
    }
})