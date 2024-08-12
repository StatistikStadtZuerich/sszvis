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
            ];

            shellHook = ''
              clear >$(tty)
              echo ""
              echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
              echo "┃                                               ┃"
              echo "┃  Welcome to the IXT development environment!  ┃"
              echo "┃                                               ┃"
              echo "┃  Build Docs:   'npm run build'                ┃"
              echo "┃  Server:       'npm start'                    ┃"
              echo "┃                                               ┃"
              echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
              echo ""
            '';
          };
        }
      );
}