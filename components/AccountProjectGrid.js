/* eslint-disable class-methods-use-this */
import React from "react";
import PropTypes from "prop-types";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SearchIcon from "@mui/icons-material/Search";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid, FixedSizeList } from "react-window";

import UiLoadingBar from "./UiLoadingBar";
import UiEmptyState from "./UiEmptyState";
import AccountProjectCard from "./AccountProjectCard";
import * as DataHooks from "../utils/data-hooks";
import * as ApiClient from "../utils/api-client";

const CARD_GAP = 24;
const LIST_CARD_GAP = 8;
const CARD_MIN_WIDTH = 280;
const CARD_HEIGHT = 132;
const PROJECT_VIEW_STORAGE_KEY = "microreact.account.projects.view";
const PROJECT_VIEW_GRID = "grid";
const PROJECT_VIEW_LIST = "list";

function getStoredViewMode() {
  if (typeof window === "undefined") {
    return PROJECT_VIEW_LIST;
  }

  const storedView = window.localStorage.getItem(PROJECT_VIEW_STORAGE_KEY);
  return storedView === PROJECT_VIEW_GRID ? PROJECT_VIEW_GRID : PROJECT_VIEW_LIST;
}

function VirtualGridCell({ columnIndex, rowIndex, style, data }) {
  const { items, columnCount, renderCard } = data;
  const index = rowIndex * columnCount + columnIndex;

  if (index >= items.length) {
    return null;
  }

  return (
    <div
      style={{
        ...style,
        paddingRight: CARD_GAP,
        paddingBottom: CARD_GAP,
      }}
    >
      { renderCard(items[index]) }
    </div>
  );
}

VirtualGridCell.propTypes = {
  columnIndex: PropTypes.number.isRequired,
  data: PropTypes.shape({
    columnCount: PropTypes.number.isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    renderCard: PropTypes.func.isRequired,
  }).isRequired,
  rowIndex: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
};

function VirtualListRow({ index, style, data }) {
  return (
    <div
      style={{
        ...style,
        paddingBottom: LIST_CARD_GAP,
      }}
    >
      { data.renderCard(data.items[index]) }
    </div>
  );
}

VirtualListRow.propTypes = {
  data: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    renderCard: PropTypes.func.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
};

const EMPTY_ARRAY = [];

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
  const projectsData = data || EMPTY_ARRAY;

  const [ searchFilter, setSearchFilter ] = React.useState("");

  const [ isLoading, setLoading ] = React.useState(false);

  const [ viewMode, setViewMode ] = React.useState(getStoredViewMode);

  const handleViewModeChange = React.useCallback(
    (event, nextViewMode) => {
      if (!nextViewMode) {
        return;
      }

      setViewMode(nextViewMode);
      window.localStorage.setItem(PROJECT_VIEW_STORAGE_KEY, nextViewMode);
    },
    [],
  );

  const filteredData = React.useMemo(
    () => {
      let result = (props.filter) ? projectsData.filter(props.filter) : projectsData;

      if (searchFilter) {
        const filter = searchFilter.toLowerCase();
        result = result.filter((x) => x.name?.toLowerCase().includes(filter));
      }

      return [ ...result ].sort((a, b) => b.updatedAt - a.updatedAt);
    },
    [ projectsData, props.filter, searchFilter ],
  );

  const renderCard = React.useCallback(
    (item) => (
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
        viewMode={viewMode}
      />
    ),
    [ data, viewMode ],
  );

  if (error) {
    return (
      <pre>{ error.message }</pre>
    );
  }

  if (!data) {
    return (<SkeletonGrid />);
  }

  return (
    <React.Fragment>
      { isLoading && <UiLoadingBar /> }

      <Grid
        alignItems="center"
        className="mr-project-grid-controls"
        container
        spacing={1}
      >
        <Grid item>
          <ToggleButtonGroup
            exclusive
            onChange={handleViewModeChange}
            size="small"
            value={viewMode}
          >
            <ToggleButton
              aria-label="Grid view"
              title="Grid view"
              value={PROJECT_VIEW_GRID}
            >
              <ViewModuleOutlinedIcon fontSize="small" />
            </ToggleButton>

            <ToggleButton
              aria-label="List view"
              title="List view"
              value={PROJECT_VIEW_LIST}
            >
              <ViewListOutlinedIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid item>
          <TextField
            size="small"
            autoFocus
            id="serach-projects-input"
            placeholder={`Search ${filteredData.length} project${filteredData.length !== 1 ? "s" : ""}...`}
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
            <div style={{ height: "calc(100vh - 120px)" }}>
              <AutoSizer>
                {
                  ({ width, height }) => {
                    if (viewMode === PROJECT_VIEW_LIST) {
                      return (
                        <FixedSizeList
                          height={height}
                          itemData={{
                            items: filteredData,
                            renderCard,
                          }}
                          itemCount={filteredData.length}
                          itemSize={CARD_HEIGHT + LIST_CARD_GAP}
                          width={width}
                        >
                          {VirtualListRow}
                        </FixedSizeList>
                      );
                    }

                    const columnCount = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)));
                    const columnWidth = Math.floor((width - ((columnCount - 1) * CARD_GAP)) / columnCount);
                    const rowCount = Math.ceil(filteredData.length / columnCount);

                    return (
                      <FixedSizeGrid
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={height}
                        itemData={{
                          columnCount,
                          items: filteredData,
                          renderCard,
                        }}
                        rowCount={rowCount}
                        rowHeight={CARD_HEIGHT + CARD_GAP}
                        width={width}
                      >
                        {VirtualGridCell}
                      </FixedSizeGrid>
                    );
                  }
                }
              </AutoSizer>
            </div>
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
