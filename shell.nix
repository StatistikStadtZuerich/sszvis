let
  pkgs = import (fetchTarball http://nixos.org/channels/nixpkgs-19.09-darwin/nixexprs.tar.xz) {};
  nodejs = pkgs.nodejs-10_x;

in pkgs.mkShell rec {
  buildInputs = [
    nodejs
    pkgs.python27
    # Some Node modules need CoreServices headers, e.g. fsevents:
    pkgs.darwin.apple_sdk.frameworks.CoreServices
    pkgs.xcbuild
  ];
}
