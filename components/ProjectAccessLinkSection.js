import PropTypes from "prop-types";
import React from "react";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import { mdiLinkVariantPlus, mdiLinkVariantRemove } from "@mdi/js";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useSnackbar } from "notistack";
import FileCopyRoundedIcon from "@mui/icons-material/FileCopyRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import UiCopyTextfield from "./UiCopyTextfield";
import * as ApiClient from "../utils/api-client";
import * as DataHooks from "../utils/data-hooks";
import config from "../utils/public-runtime-config";

// eslint-disable-next-line react/display-name
const LinkPlusIcon = React.memo(
  (props) => (
    <SvgIcon {...props}>
      <path d={mdiLinkVariantPlus} />
    </SvgIcon>
  ),
);

// eslint-disable-next-line react/display-name
const LinkMinusIcon = React.memo(
  (props) => (
    <SvgIcon {...props}>
      <path d={mdiLinkVariantRemove} />
    </SvgIcon>
  ),
);

// eslint-disable-next-line react/display-name
const CopyUrl = React.memo(
  (props) => {
    const { enqueueSnackbar } = useSnackbar();

    return (
      <CopyToClipboard
        text={props.value}
        onCopy={() => enqueueSnackbar("Link has been copied", { variant: "success" })}
      >
        { props.children }
      </CopyToClipboard>
    );
  }
);

CopyUrl.propTypes = {
  value: PropTypes.string,
  children: PropTypes.func,
};

class ProjectAccessLinkSection extends React.PureComponent {

  state = {
    alias: undefined,
  }

  aliasRef = React.createRef()

  addAlias = (event) => {
    event.stopPropagation();
    this.setAlias(
      this.props.projectAccessData.id,
      this.focusAliasInput,
    );
  }

  focusAliasInput = () => {
    this.aliasRef?.current?.focus();
    this.aliasRef?.current?.select();
  }

  setAlias = (text, callback) => {
    const alias = text.toLowerCase().replace(/[^0-9a-z]+/g, "-");
    this.setState(
      {
        alias,
        isAliasTaken: false,
      },
      callback,
    );
  }

  resetAlias = () => {
    this.setState({
      alias: null,
      isAliasTaken: false,
    });
  }

  saveAlias = async (alias) => {
    const { props } = this;
    const flag = await ApiClient.updateProjectAlias(
      props.projectAccessData.id,
      alias || null,
    );
    if (flag) {
      DataHooks.projectAccessMutation(props.projectAccessData.id);
      this.resetAlias();
    }
    else {
      this.setState(
        { isAliasTaken: true },
        this.focusAliasInput,
      );
    }
  }

  handleSaveAlias = () => {
    const { state } = this;
    this.saveAlias(state.alias);
  }

  handleRemoveAlias = () => {
    this.saveAlias(null);
    this.resetAlias();
  }

  render() {
    const { props, state } = this;
    const alias = state.alias || props.projectAccessData.alias;
    const hasAnAlias = (typeof (alias) === "string");
    const aliasChanged = (!!state.alias);

    return (
      <section className="project-link">
        <UiCopyTextfield
          label="Project Link"
          value={props.projectAccessData.url}
        >
          {
            !hasAnAlias && (
              <IconButton
                aria-label="Copy"
                edge="end"
                title="Add an alias"
                onClick={this.addAlias}
              >
                <LinkPlusIcon />
              </IconButton>
            )
          }
        </UiCopyTextfield>

        {
          hasAnAlias && (
            <FormControl
              variant="outlined"
              color="primary"
              className="mr-project-alias"
            >
              <InputLabel
                error={!!state.isAliasTaken}
              >
                Alias
              </InputLabel>

              <OutlinedInput
                color="primary"
                endAdornment={
                  <InputAdornment position="end">
                    {
                      aliasChanged && (
                        <IconButton
                          aria-label="Save alias"
                          edge="end"
                          title="Save alias"
                          onClick={this.handleSaveAlias}
                        >
                          <SaveRoundedIcon />
                        </IconButton>
                      )
                    }

                    {
                      !aliasChanged && (
                        <IconButton
                          aria-label="Remove alias"
                          edge="end"
                          title="Remove alias"
                          onClick={this.handleRemoveAlias}
                        >
                          <LinkMinusIcon />
                        </IconButton>
                      )
                    }

                    {
                      !aliasChanged && (
                        <CopyUrl value={props.projectAccessData.aliasUrl}>
                          <IconButton
                            aria-label="Copy"
                            edge="end"
                          >
                            <FileCopyRoundedIcon />
                          </IconButton>
                        </CopyUrl>
                      )
                    }
                  </InputAdornment>
                }
                error={!!state.isAliasTaken}
                inputRef={this.aliasRef}
                label="Alias"
                onChange={(event) => this.setAlias(event.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <small>{ config.baseUrl }project/</small>
                  </InputAdornment>
                }
                value={alias}
              />

              {
                state.isAliasTaken && (
                  <FormHelperText
                    error={!!state.isAliasTaken}
                  >
                    This alias is not available.
                  </FormHelperText>
                )
              }
            </FormControl>
          )
        }

      </section>
    );
  }

}

ProjectAccessLinkSection.propTypes = {
  projectAccessData: PropTypes.object.isRequired,
};

ProjectAccessLinkSection.defaultProps = {
};

export default ProjectAccessLinkSection;
