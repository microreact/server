import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import RestoreFromTrashOutlinedIcon from "@mui/icons-material/RestoreFromTrashOutlined";
import dynamic from "next/dynamic";

import UiLoadingBar from "./UiLoadingBar";
import ProjectAccessTrigger from "./ProjectAccessTrigger";

import { root as rootClassName } from "../styles/account-project-card.module.css";

const MoveProjectToFolderMenu = dynamic(
  () => import("./MoveProjectToFolderMenu"),
  {
    loading: UiLoadingBar,
    ssr: false,
  },
);

function AccountProjectCard(props) {
  return (
    <Card
      className={rootClassName}
      variant="outlined"
    >
      <CardContent
        component="a"
        href={props.url}
        onClick={props.onLoading}
      >
        <Typography
          className="title"
          color="textPrimary"
          title={props.name}
        >
          { props.name }
        </Typography>

        <Typography
          className="attribute"
          color="textSecondary"
        >
          ID: { props.id }
        </Typography>

        <Typography
          className="attribute"
          color="textSecondary"
        >
          {
            (props.access === 0) ? "Restricted Access" :
              (props.access === 1) ? "Public Access" :
                props.access
          }
        </Typography>

        <Typography
          className="attribute"
          color="textSecondary"
        >
          Created { new Date(props.createdAt).toLocaleDateString() }
        </Typography>
      </CardContent>

      {
        (!props.shared)
          &&
          (
            <CardActions className="secondary">
              <IconButton
                title={props.starred ? "Starred" : "Not Starred"}
                onClick={props.onStar}
              >
                {
                  props.starred
                    ?
                    <StarOutlinedIcon fontSize="inherit" />
                    :
                    <StarOutlineOutlinedIcon fontSize="inherit" />
                }
              </IconButton>
            </CardActions>
          )
      }

      <CardActions disableSpacing className="main">
        {
          (props.role === "owner") && (
            <MoveProjectToFolderMenu
              projectId={props.id}
              folder={props.folder}
              onMove={props.onMove}
            />
          )
        }
        {
          (props.role === "owner" || props.role === "manager") && (
            <ProjectAccessTrigger
              projectId={props.id}
            />
          )
        }
        {
          (props.role === "owner") && (
            <IconButton
              title={props.binned ? "Restore Project" : "Delete Project"}
              onClick={props.onDelete}
            >
              {
                props.binned
                  ?
                  <RestoreFromTrashOutlinedIcon fontSize="inherit" />
                  :
                  <DeleteOutlineOutlinedIcon fontSize="inherit" />
              }
            </IconButton>
          )
        }
      </CardActions>

    </Card>
  );
}

AccountProjectCard.propTypes = {
  access: PropTypes.number,
  binned: PropTypes.bool,
  createdAt: PropTypes.string,
  folder: PropTypes.string,
  id: PropTypes.string.isRequired,
  role: PropTypes.s,
  name: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  onLoading: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onStar: PropTypes.func.isRequired,
  shared: PropTypes.bool,
  starred: PropTypes.bool,
  url: PropTypes.string.isRequired,
};

export default AccountProjectCard;
