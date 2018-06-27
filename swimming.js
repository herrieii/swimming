const https = require('https');
const JSDOM = require('jsdom').JSDOM;

const SITES = [
  {
    name: 'Blauwe Golf',
    url: 'https://www.bvsport.nl/accommodatie/60/zwembad-de-blauwe-golf'
  },
  {
    name: 'Kalverdijkje',
    url: 'https://www.bvsport.nl/accommodatie/62/zwembad-kalverdijkje'
  }
];
const POOL = 'Wedstrijdbad';

function getPage(url, callback) {
  /* Requests the document and calls the callback with the data. */

  https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      callback(data);
    });
  });
}

function scrapePage(data) {
  /* Scrapes schedule data from the document data and returns either the
  schedule or null if no schedule is found. */

  const dom = new JSDOM(data);
  // assume day headings are h4 elements
  const h4Els = dom.window.document.getElementsByTagName('h4');

  if (h4Els.length === 0) {
    return null;
  }

  const schedule = {
    maandag: [],
    dinsdag: [],
    woensdag: [],
    donderdag: [],
    vrijdag: [],
    zaterdag: [],
    zondag: []
  };

  Array.from(h4Els).every((h4El) => {
    const heading = h4El.textContent;

    // assume non-day headings come after all the days
    if (!(heading in schedule)) {
      // stop looking for more days
      return false;
    }

    // assume pool headings are h5 elements
    const poolEl = Array.from(h4El.parentNode.parentNode.getElementsByTagName('h5')).find((h5El) => {
      return (h5El.textContent === POOL);
    });

    // assume divs contain the hours
    Array.from(poolEl.parentNode.getElementsByTagName('div')).forEach((divEl) => {
      const line = divEl.textContent.trim();

      // add found hours to this day
      schedule[heading].push(line);
    });

    // look for more days on this page
    return true;
  });

  return schedule;
}

function outputSchedule(schedule, name) {
  /* Prints the name and the schedule. */

  console.log(name);

  if (!schedule) {
    console.log(indent('?'));
    return;
  }

  Object.keys(schedule).forEach((day) => {
    console.log(indent(day));

    if (schedule[day].length === 0) {
      console.log(indent('-', 2));
      return;
    }

    schedule[day].forEach((time) => {
      console.log(indent(time, 2));
    });
  });
}

function indent(text, depth) {
  /* Adds indentation to given text with optional given depth and returns
  indented text. */

  const indentation = '  ';

  do {
    text = indentation + text;
    depth--;
  } while (depth > 0);

  return text;
}

function scrapeAll(sites) {
  const schedules = [];
  let loading = sites.length;

  sites.forEach((site, index) => {
    getPage(site.url, (data) => {
      const schedule = scrapePage(data);

      schedules[index] = {name: site.name, data: schedule};

      loading--;
      if (loading === 0) {
        outputAll(schedules);
      }
    });
  });
}

function outputAll(schedules) {
  schedules.forEach((schedule, index) => {
    if (index > 0) {
      // separate by new line
      console.log();
    }

    outputSchedule(schedule.data, schedule.name);
  });
}

scrapeAll(SITES);
