'use strict';

const expect = require('chai').expect;
const tmp = require('tmp');
const gitFixtures = require('git-fixtures');
const buildTmp = require('../helpers/build-tmp');

const processBin = gitFixtures.processBin;
const _fixtureCompare = gitFixtures.fixtureCompare;

describe('Acceptance - git-diff-apply', function() {
  this.timeout(30000);

  let localDir;
  let remoteDir;

  beforeEach(function() {
    localDir = tmp.dirSync().name;
    remoteDir = tmp.dirSync().name;
  });

  function merge(options) {
    let localFixtures = options.localFixtures;
    let remoteFixtures = options.remoteFixtures;

    buildTmp({
      fixturesPath: localFixtures,
      tmpPath: localDir
    });
    buildTmp({
      fixturesPath: remoteFixtures,
      tmpPath: remoteDir
    });

    return processBin({
      binFile: 'git-diff-apply',
      args: [
        '--remote-url',
        remoteDir,
        '--start-tag',
        'v1',
        '--end-tag',
        'v3',
        '--resolve-conflicts'
      ],
      cwd: localDir,
      commitMessage: 'local',
      expect
    });
  }

  function fixtureCompare(options) {
    let mergeFixtures = options.mergeFixtures;

    let actual = localDir;
    let expected = mergeFixtures;

    _fixtureCompare({
      expect,
      actual,
      expected
    });
  }

  it('handles conflicts', function() {
    return merge({
      localFixtures: 'test/fixtures/local/conflict',
      remoteFixtures: 'test/fixtures/remote/conflict'
    }).then(result => {
      let status = result.status;

      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/conflict'
      });

      expect(status).to.equal(`A  added-changed.txt
A  added-unchanged.txt
M  present-added-changed.txt
M  present-changed.txt
D  removed-changed.txt
D  removed-unchanged.txt
`);
    });
  });

  it('ignores .git folder', function() {
    return merge({
      localFixtures: 'test/fixtures/local/git',
      remoteFixtures: 'test/fixtures/remote/git'
    }).then(result => {
      let status = result.status;

      fixtureCompare({
        mergeFixtures: 'test/fixtures/merge/git'
      });

      expect(status).to.equal(`M  .gitignore
`);
    });
  });
});
