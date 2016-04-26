import Ember from 'ember';
import layout from '../templates/components/get-gender';
// import fetch from 'fetch';
import DDAU from 'ember-gender/mixins/ddau';

const { keys, create } = Object; // jshint ignore:line
const { RSVP: {Promise, all, race, resolve, defer} } = Ember; // jshint ignore:line
const { inject: {service} } = Ember; // jshint ignore:line
const { computed, observer, $, run, on, typeOf } = Ember;  // jshint ignore:line
const { get, set, debug } = Ember; // jshint ignore:line
const a = Ember.A; // jshint ignore:line
const GENDER_API = 'https://api.genderize.io';

/**
 * Gets the gender of a first name, optionally with greater specificity to a country assumption
 */
const getGender = Ember.Component.extend(DDAU, {
  layout,
  tagName: '',

  name: null,
  timeout: 2000,
  gender: null,
  probability: null,
  errorState: null,
  changedAt: null,
  /**
   * Returns a boolean indicating whether the given name has a gender probability
   * which has been found
   */
  found: undefined,
  _found: observer('name', 'country', 'timeout', function() {
    const {name, country, timeout} = this.getProperties('name', 'country', 'timeout');
    console.log(`Getting data for ${name}`);
    if(name) {
      this.set('found', undefined); // it's not found yet!
      this.findProbability(name, country, timeout)
        .then(result => {
          // THIS CAN BE REINTRODUCED ONCE FETCH IS READY:
          // response.json().then(result => {
            if(result && result.gender) {
              this.ddau('onChange', result, result);
            } else {
              const errorObj = { error: 'no results found', gender: null, probability: null, count: 0 };
              this.ddau('onChange', errorObj, errorObj);
              this.ddau('onError', {
                code: 'response-no-gender',
                details: result
              }, null);
            }

            this.set('probability', result.probability);
            this.set('gender', result.gender);
            this.set('count', result.count);
            this.set('found', true);
            this.set('errorState', null);
            this.set('changedAt', Date());
          // }); REMOVED WITH AJAX REPLACEMENT OF FETCH
        })
        .catch(error => {
          const errorObj = { error: error, gender: null, probability: null, count: null };
          this.ddau('onChange', errorObj, errorObj);
          this.set('probability', undefined);
          this.set('gender', undefined);
          this.set('count', undefined);
          this.set('found', false);
          this.set('errorState', error);
          this.set('changedAt', Date());
        });
    } else {
      this.set('errorState', null);
      this.set('probability', undefined);
      this.set('gender', undefined);
      this.set('count', undefined);
      this.set('found', undefined);
    }
    this.set('changedAt', Date());
  }),
  findProbability(name, country, validFor) {
    let endpoint = GENDER_API + `/?name=${name}`;
    if (country) {
      endpoint += `&country_id=${country}`;
    }
    // const attempt = fetch(endpoint);
    const attempt = new Promise((respond, reject) => {
      $.ajax({method: 'GET', url: endpoint})
        .done(respond)
        .fail(reject);
    });
    const timeout = new Promise((respond, reject) => {
      setTimeout(function () {
        reject('timed out');
      }, validFor);
    });
    return Promise.race([attempt, timeout]);
  },

});

getGender[Ember.NAME_KEY] = 'get-gender';
export default getGender;
