function getProjectProps(user) {
  const props = {};
  props.id = this.id;
  props.version = this.version;
  props.url = this.url();
  props.role = this.getUserRole(user?.id);
  props.isOwner = props.role === "owner";
  props.isManager = props.isOwner || props.role === "manager";
  props.isEditor = props.isManager || props.role === "editor";
  return props;
}

module.exports = getProjectProps;
