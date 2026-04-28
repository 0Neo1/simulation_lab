/* eslint-disable no-unused-vars */
import { IconButton, Menu, MenuItem } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { ModalContext } from '../../../App';
import { createDialogAtom, joinDialogAtom } from '../../../utils/atoms';
import CreateClass from '../../Labroom/CreateClass';
import JoinClass from '../../Labroom/JoinClass';
import NotificationBar from './NotificationBar';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

function HeaderBar() {
  const { page } = useParams();
  const { auth } = useSelector((state) => state);
  const { sidebarOpen, setSidebarOpen } = useContext(ModalContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [createOpened, setCreateOpened] = useRecoilState(createDialogAtom);
  const [joinOpened, setJoinOpened] = useRecoilState(joinDialogAtom);

  const location = useLocation();
  const { pathname } = location;
  const path = pathname.split('/')[1];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <header className="sticky top-0 bg-indigo-50 border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          {/* Hamburger button */}
          <button
            className="text-gray-500 hover:text-gray-600 lg:hidden mr-4"
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="5" width="16" height="2" />
              <rect x="4" y="11" width="16" height="2" />
              <rect x="4" y="17" width="16" height="2" />
            </svg>
          </button>

          {/* Header: Left side */}
          <nav className="flex rounded font-body w-8/12 ">
            <ol className="list-reset flex flex-wrap tracking-wide text-lg">
              <li>
                <NavLink
                  exact
                  to={`/${page || path}`}
                  className="font-medium text-brand-900"
                >
                  {page === 'simulation-phy' ||
                  page === 'simulation-che'
                    ? 'Simulation'
                    : path === 'dashboard'
                    ? 'Dashboard'
                    : path === 'profile'
                    ? 'Profile'
                    : path ===
                      'meter-bridge'
                    ? 'Simulation'
                    : path ===
                      'kmno4-titration'
                    ? 'Simulation'
                    : 'Dashboard'}
                </NavLink>
              </li>
              <li>
                <span className="mx-2 font-bold">&gt;</span>
              </li>
              <li className="flex flex-wrap">
                <NavLink
                  exact
                  to={`/${page || path}`}
                  className="font-medium text-brand-900"
                >
                  {page === 'simulation-phy'
                    ? 'Physics'
                    : page === 'simulation-che'
                    ? 'Chemistry'
                    : path === 'dashboard'
                    ? 'Welcome'
                    : path === 'profile'
                    ? 'Edit'
                    : path ===
                      'meter-bridge'
                    ? 'Meter Bridge Simulation'
                    : path ===
                      'kmno4-titration'
                    ? 'KMnO4 Titration Simulation'
                    : ''}
                </NavLink>
                {page === 'labroom' && (
                  <>
                    <CreateClass />
                    <JoinClass />
                    <IconButton
                      aria-controls="simple-menu"
                      aria-haspopup="true"
                      onClick={handleClick}
                    >
                      <Add />
                    </IconButton>
                    <Menu
                      id="simple-menu"
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                    >
                      {auth.user.role === 'student' ? (
                        <MenuItem
                          onClick={() => {
                            setJoinOpened(true);
                            handleClose();
                          }}
                        >
                          Join Lab Room
                        </MenuItem>
                      ) : auth.user.role === 'teacher' ? (
                        <MenuItem
                          onClick={() => {
                            setCreateOpened(true);
                            handleClose();
                          }}
                        >
                          Create Lab Room
                        </MenuItem>
                      ) : null}
                    </Menu>
                  </>
                )}
              </li>
            </ol>
          </nav>

          {/* Header: Right side */}
          <div className="flex items-center">
            <SearchBar />
            <NotificationBar />
            {/*  Divider */}
            <hr className="w-px h-7 bg-gray-400 mx-3" />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderBar;
