# let
#   pkgs = import (fetchTarball http://nixos.org/channels/nixpkgs-20.03-darwin/nixexprs.tar.xz) {};
#   nodejs = pkgs.nodejs-12_x;

# in pkgs.mkShell rec {
#   buildInputs = [
#     nodejs
#     pkgs.python27
#     # Some Node modules need CoreServices headers, e.g. fsevents:
#     pkgs.darwin.apple_sdk.frameworks.CoreServices
#     pkgs.xcbuild
#   ];
# }


let
  pkgs = import <nixpkgs> { };
  nodejs = pkgs.nodejs-16_x;

in pkgs.mkShell {
  buildInputs = [
    pkgs.darwin.apple_sdk.frameworks.CoreServices
    nodejs
  ];
  NODE_OPTIONS = "--max_old_space_size=4000";
}