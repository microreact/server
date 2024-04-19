/* eslint-disable class-methods-use-this */
import React from "react";
import PropTypes from "prop-types";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";

import UiLoadingBar from "./UiLoadingBar";
import UiEmptyState from "./UiEmptyState";
import AccountProjectCard from "./AccountProjectCard";
import * as DataHooks from "../utils/data-hooks";
import * as ApiClient from "../utils/api-client";

async function handleStarProject(data, projectId, isStarred) {
  const projects = [ ...data ];
  const projectIndex = projects.findIndex((x) => x.id === projectId);
  projects[projectIndex] = {
    ...projects[projectIndex],
    starred: isStarred,
  };
  DataHooks.userProjectsMutation(projects, false);

  await ApiClient.updateProjectStar(projectId, isStarred);
}

async function handleMoveProject(data, projectId, folderIdOrName, allFolders) {
  const isNewFolder = folderIdOrName.endsWith(" (create new)");
  const projects = [ ...data ];
  const projectIndex = projects.findIndex((x) => x.id === projectId);
  projects[projectIndex] = {
    ...projects[projectIndex],
    folder: folderIdOrName,
  };
  DataHooks.userProjectsMutation(projects, false);

  await ApiClient.updateProjectFolder(
    projectId,
    isNewFolder ? folderIdOrName.substr(0, folderIdOrName.length - 13) : folderIdOrName,
  );

  if (isNewFolder) {
    DataHooks.userFoldersMutation(undefined, true);
    DataHooks.userProjectsMutation(projects, true);
  }
}

async function handleDeleteProject(data, projectId, isBinned) {
  const projects = [ ...data ];
  const projectIndex = projects.findIndex((x) => x.id === projectId);
  projects[projectIndex] = {
    ...projects[projectIndex],
    binned: isBinned,
  };
  DataHooks.userProjectsMutation(projects, false);

  await ApiClient.updateProjectBin(projectId, isBinned);
}

function SkeletonGrid() {
  return (
    <div>
      <UiLoadingBar />

      <Grid container spacing={3}>
        {
          Array.from(new Array(12)).map(
            (_, index) => (
              <Grid
                key={index}
                item
                xs={12}
                sm={6}
                md={4}
                lg={4}
                xl={3}
              >
                <Skeleton variant="rect" height={132} />
              </Grid>
            )
          )
        }
      </Grid>
    </div>
  );
}

function AccountProjectGrid(props) {
  const { data, error } = props.apiEndpoint();

  const [ searchFilter, setSearchFilter ] = React.useState("");

  const [ isLoading, setLoading ] = React.useState(false);

  if (error) {
    return (
      <pre>{ error.message }</pre>
    );
  }

  if (!data) {
    return (<SkeletonGrid />);
  }

  let filteredData = (props.filter) ? data.filter(props.filter) : data;

  if (searchFilter) {
    const filter = searchFilter.toLowerCase();
    filteredData = data.filter((x) => x.name?.toLowerCase().includes(filter));
  }

  return (
    <React.Fragment>
      { isLoading && <UiLoadingBar /> }

      <Grid
        alignItems="flex-end"
        className="mr-project-grid-controls"
        container
        spacing={1}
      >
        <Grid item>
          <TextField
            size="small"
            autoFocus
            id="serach-projects-input"
            placeholder="Search"
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {
        (filteredData && filteredData.length === 0)
          ?
          (
          <UiEmptyState
            icon={props.emptyIcon}
            message={props.emptyMessage}
          />
          )
          :
          (
            <Grid container spacing={3}>
              {
                filteredData.map(
                  (item) => (
                    <Grid
                      key={item.id}
                      item
                      xs={12}
                      sm={12}
                      md={6}
                      lg={4}
                      xl={3}
                    >
                      <AccountProjectCard
                        access={item.access}
                        binned={item.binned}
                        createdAt={item.createdAt}
                        destination={item.destination}
                        folder={item.folder}
                        shared={item.shared}
                        role={item.role}
                        id={item.id}
                        name={item.name}
                        onDelete={() => handleDeleteProject(data, item.id, !item.binned)}
                        onLoading={setLoading}
                        onMove={(folderId, allFolders) => handleMoveProject(data, item.id, folderId, allFolders)}
                        onStar={() => handleStarProject(data, item.id, !item.starred)}
                        starred={item.starred}
                        updatedAt={item.updatedAt}
                        url={item.url}
                      />
                    </Grid>
                  )
                )
              }
            </Grid>
          )
      }
    </React.Fragment>
  );
}

AccountProjectGrid.propTypes = {
  apiEndpoint: PropTypes.func.isRequired,
  emptyIcon: PropTypes.node,
  emptyMessage: PropTypes.node,
  filter: PropTypes.func,
};

export default AccountProjectGrid;
