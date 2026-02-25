{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux"; # 環境に合わせて変更 (aarch64-darwin等)
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs
          nodePackages.npm
        ];

        shellHook = ''
          if [ ! -d node_modules ]; then
            echo "node_modules not found. Running npm install..."
            npm ci
          fi
        '';
      };
    };
}

