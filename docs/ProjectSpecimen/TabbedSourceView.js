import React from "react";
import PropTypes from "prop-types";
import normalizeReferences from "./normalizeReferences";
import { text } from "./utils/typography";

function getStyle(theme) {
  return {
    button: {
      ...text(theme),
      background: "#eee",
      color: theme.brandColor,
      borderBottom: "none",
      cursor: "pointer",
      display: "inline-block",
      float: "left",
      textAlign: "center",
      minWidth: 120,
      padding: 10,
      borderRight: "1px solid transparent"
    },
    active: {
      background: "white",
      borderRight: "1px solid #eee"
    },
    source: {
      ...text(theme, -0.5),
      fontWeight: 400,
      background: "#fff",
      borderLeft: "none",
      borderBottom: "none",
      borderRight: "none",
      borderTop: "1px solid #eee",
      color: theme.textColor,
      fontFamily: theme.fontMono,
      lineHeight: 1.4,
      clear: "both",
      display: "block",
      padding: 20,
      height: "50vh",
      width: "100%",
      boxSizing: "border-box"
    }
  };
}

class TabbedSourceView extends React.Component {
  constructor() {
    super();
    this.state = {
      tab: null,
      sourceCode: null
    };
  }

  componentDidMount() {
    this.loadSourceCode();
  }

  componentDidUpdate() {
    if (!this.state.sourceCode && !this.state.error) {
      this.loadSourceCode();
    }
  }

  render() {
    let { sourceFiles, theme } = this.props;
    let styles = getStyle(theme);

    let fileTabs =
      sourceFiles.length > 1
        ? sourceFiles.map((file, i) => {
            let activeTab =
              i === parseInt(this.state.tab, 10) ? styles.active : {};
            return (
              <div
                onClick={this.selectTab.bind(this, this)}
                key={i}
                data-tab-id={i}
                style={{ ...styles.button, ...activeTab }}
              >
                {file.target}
              </div>
            );
          })
        : null;

    let sourceView = this.state.tab ? (
      <textarea
        style={styles.source}
        value={this.state.sourceCode ? this.state.sourceCode : "Loading …"}
        readOnly={true}
      />
    ) : null;

    return (
      <div className="cg-Specimen-TabbedSourceView">
        {fileTabs}
        {sourceView}
      </div>
    );
  }

  selectTab(_context, evt) {
    let nextTab = evt.currentTarget.getAttribute("data-tab-id");
    _context.setState({
      sourceCode: null,
      tab: nextTab === this.state.tab ? null : nextTab
    });
  }
  loadSourceCode() {
    let { sourceFiles } = this.props;
    if (!this.state.tab) {
      return;
    }
    let file = sourceFiles[this.state.tab];

    fetch(file.source, { credentials: "include" })
      .then(response => response.text())
      .then(text => {
        const sourceCode = this.parseSourceCode(text);
        this.setState({
          sourceCode: normalizeReferences(
            this.props.rootPath,
            this.props.files,
            sourceCode
          )
        });
      })
      .catch(error => {
        this.setState({
          error: error,
          sourceCode: null
        });
      });
  }

  parseSourceCode(source, template) {
    if (template) {
      let doc = new DOMParser().parseFromString(source, "text/html");
      let ref = doc.querySelectorAll("[data-catalog-project-expose]");
      ref.map(item => {
        item.removeAttribute("data-catalog-project-expose");
      });
      template.replace("${yield}", doc.body.innerHTML);
      return template;
    }
    return source;
  }
}

TabbedSourceView.propTypes = {
  sourceFiles: PropTypes.array.isRequired,
  theme: PropTypes.object.isRequired
};

export default TabbedSourceView;
