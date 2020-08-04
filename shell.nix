let
  pkgs = import (fetchTarball http://nixos.org/channels/nixpkgs-20.03-darwin/nixexprs.tar.xz) {};
  nodejs = pkgs.nodejs-12_x;

in pkgs.mkShell rec {
  buildInputs = [
    nodejs
    pkgs.python27
    # Some Node modules need CoreServices headers, e.g. fsevents:
    pkgs.darwin.apple_sdk.frameworks.CoreServices
    pkgs.xcbuild
  ];
}
