const https = require('https');
const JSDOM = require('jsdom').JSDOM;

function scrape(url, callback) {
  /* Requests the document and calls the callback with the schedule if the
  schedule is found. */

  https.get(url, (res) => {
    res.on('data', (chunk) => {
      const schedule = parse(chunk);

      if (!schedule) {
        return;
      }

      callback(schedule);
    });
  });
}

function parse(chunk) {
  /* Parses the document chunk and returns the schedule or null if no schedule
  is found. */

  const dom = new JSDOM(chunk);
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

    if (heading === 'Tarieven') {  // this heading is assumed to be after the schedule
      return false;
    }

    Array.from(h4El.parentNode.parentNode.getElementsByTagName('h5')).forEach((h5El) => {
      if (h5El.textContent !== 'Wedstrijdbad') {
        return;
      }

      Array.from(h5El.parentNode.getElementsByTagName('div')).forEach((divEl) => {
        const line = divEl.textContent.trim();

        if (!line) {
          return;
        }

        schedule[heading].push(line);
      });
    });

    // look for more opening hours
    return true;
  });

  return schedule;
}

function output(schedule, name) {
  /* Prints the name and the schedule. */

  console.log(name);

  Object.keys(schedule).forEach((day) => {
    if (schedule[day].length === 0) {
      return;
    }

    console.log(indent(day));
    schedule[day].forEach((time) => {
      console.log(indent(time, 2));
    });
  });
}

function indent(text, depth) {
  const indentation = '  ';

  do {
    text = indentation + text;
    depth--;
  } while (depth > 0);

  return text;
}

scrape('https://www.bvsport.nl/accommodatie/60/zwembad-de-blauwe-golf', (schedule) => {
  output(schedule, 'Blauwe Golf');

  scrape('https://www.bvsport.nl/accommodatie/62/zwembad-kalverdijkje', (schedule) => {
    output(schedule, '\nKalverdijkje');

    console.log('\nZondag Kalverdijkje is alleen oefenzwemmen.');
  });
});
