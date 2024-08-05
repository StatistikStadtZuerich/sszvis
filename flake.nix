{
  description = "Development environment from IXT";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };

        in {
          devShells.default = pkgs.mkShell {
            buildInputs = [
              pkgs.nodejs_20
              pkgs.yarn
            ];

            shellHook = ''
              clear >$(tty)
              echo ""
              echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
              echo "┃                                               ┃"
              echo "┃  Welcome to the IXT development environment!  ┃"
              echo "┃                                               ┃"
              echo "┃  Development Server:   'yarn dev'             ┃"
              echo "┃  Storybook:            'yarn run storybook'   ┃"
              echo "┃                                               ┃"
              echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
              echo ""
            '';
          };
        }
      );
}