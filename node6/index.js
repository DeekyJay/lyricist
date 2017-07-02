'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fetch = require('isomorphic-fetch');
const cheerio = require('cheerio');

module.exports = class Lyricist {
  constructor(accessToken, headers) {
    if (!accessToken) throw new Error('No access token provided to lyricist!');
    this.accessToken = accessToken;
    if (headers) this.headers = headers;
  }

  /*
  Main request function
  */

  _request(path) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const url = `https://api.genius.com/${path}`;
      let headers = {
        'Authorization': `Bearer ${_this.accessToken}`
      };
      headers = Object.assign(headers, _this.headers);
      console.log(headers);

      var _ref = yield fetch(url, { method: 'GET', headers }).then(function (response) {
        console.log(response);
        return response.json();
      }).catch(function (err) {
        throw err;
      });

      const meta = _ref.meta,
            response = _ref.response;


      if (meta.status !== 200) {
        throw new Error(`${meta.status}: ${meta.message}`);
      }
      return response;
    })();
  }

  /*
  Search song by ID
  */

  song(id, { fetchLyrics = false } = {}) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (!id) throw new Error('No ID was provided to lyricist.song()');

      var _ref2 = yield _this2._request(`songs/${id}`);

      const song = _ref2.song;


      const lyrics = fetchLyrics ? yield _this2._scrapeLyrics(song.url) : null;

      return Object.assign({ lyrics }, song);
    })();
  }

  /*
  Get album by ID
  */

  album(id, { fetchTracklist = false } = {}) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (!id) throw new Error('No ID was provided to lyricist.album()');

      var _ref3 = yield _this3._request(`albums/${id}`);

      const album = _ref3.album;


      const tracklist = fetchTracklist ? yield _this3._scrapeTracklist(album.url) : null;

      return Object.assign({ tracklist }, album);
    })();
  }

  /* Get artist */

  artist(id, opts) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (!id) throw new Error('No ID was provided to lyricist.artist()');

      var _ref4 = yield _this4._request(`artists/${id}`);

      const artist = _ref4.artist;

      return artist;
    })();
  }

  /* Get artist songs */

  songsByArtist(id, { page = 1, perPage = 20, sort = 'title' } = {}) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      if (!id) throw new Error('No ID was provided to lyricist.songsByArtist()');

      var _ref5 = yield _this5._request(`artists/${id}/songs?per_page=${perPage}&page=${page}&sort=${sort}`);

      const songs = _ref5.songs;

      return songs;
    })();
  }

  search(query) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      if (!query) throw new Error('No query was provided to lyricist.search()');
      const response = yield _this6._request(`search?q=${query}`);
      return response.hits.map(function (hit) {
        return hit.result;
      });
    })();
  }

  /*
  Scrape tracklist
  */

  _scrapeTracklist(url) {
    return _asyncToGenerator(function* () {
      const html = yield fetch(url).then(function (res) {
        return res.text();
      });
      const $ = cheerio.load(html);
      const json = $('meta[itemprop="page_data"]').attr('content');
      const parsed = JSON.parse(json);
      const songs = parsed.album_appearances;
      return songs.map(function ({ song, track_number }) {
        return Object.assign({ track_number }, song);
      });
    })();
  }

  /* Scrape song lyrics */

  _scrapeLyrics(url) {
    return _asyncToGenerator(function* () {
      const response = yield fetch(url);
      const text = yield response.text();
      const $ = cheerio.load(text);
      return $('.lyrics').text().trim();
    })();
  }
};
