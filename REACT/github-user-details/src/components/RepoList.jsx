import React from 'react';
import PropTypes from 'prop-types';

const RepoList = ({ repos }) => (
  <div>
    <h3>REPOSITORIES:</h3>
    <ul>
      {repos.map((repo) => (
        <li key={repo.id}>{repo.name}</li>
      ))}
    </ul>
  </div>
);

RepoList.propTypes = {
  repos: PropTypes.array.isRequired,
};

export default RepoList;