import React from 'react';
import PropTypes from 'prop-types';
import RepoList from './RepoList';

const UserDetails = ({ user, repos, onReset }) => (
  <div className="user-details">
    <div className="user-info">
      <img src={user.avatar_url} alt="User Avatar" />
      <div className="user-meta">
        <h2>{user.name}</h2>
        <p><strong>Location:</strong> {user.location}</p>
        <p><strong>Bio:</strong> {user.bio}</p>
      </div>
    </div>
    <RepoList repos={repos} />
    <button onClick={onReset}>Reset</button>
  </div>
);

UserDetails.propTypes = {
  user: PropTypes.object.isRequired,
  repos: PropTypes.array.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default UserDetails;