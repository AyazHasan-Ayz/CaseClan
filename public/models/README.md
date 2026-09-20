# Production model integration

No production GLB/GLTF files were supplied. The interactive development geometry is illustrative, not a fit or manufacturing guarantee.

Add device-specific files here, then add a full `ModelConfig` in `lib/customizer.ts` → `approvedModels`, keyed by the catalog device slug. Provide dimensions, printable area, camera exclusion rectangle, safety margin and the `printMesh` name. Model units must match the configured dimensions and its center must be at the origin, printable back facing +Z. The printable mesh must have non-overlapping UVs mapping the flat 1:2 artwork canvas (top-left is UV 0,0). Other meshes retain their materials. Only the selected device loads.

Validate geometry, UV orientation, camera holes and physical print dimensions with production before setting `development:false`. Exports remain marked `productionApproved:false` until that validation and a real production workflow are connected.
