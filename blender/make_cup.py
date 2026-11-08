"""Builds the Cafflora 3D coffee cup and exports it for the website.

Run from the project folder:
  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b --factory-startup --python blender/make_cup.py -- client/public/models/cafflora-cup.glb

Objects (the website looks some of these up by name):
  Cup     glossy dark ceramic cup
  Rim     thin gold band on the cup's lip
  Handle  cup handle
  Coffee  coffee surface (the website paints the latte art onto it)
  Saucer  matching saucer
"""
import math
import sys

import bmesh
import bpy

out_path = sys.argv[sys.argv.index('--') + 1]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_color(value):
    value = value.lstrip('#')
    return tuple(srgb_to_linear(int(value[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def make_material(name, color, roughness, metallic=0.0, coat=0.0, coat_roughness=0.1):
    mat = bpy.data.materials.new(name)
    if hasattr(mat, 'use_nodes') and not mat.use_nodes:
        mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = hex_color(color)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = coat_roughness
    return mat


def make_object(name, verts, faces, material, subdiv=0, uvs=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    if uvs:
        layer = mesh.uv_layers.new(name='UVMap')
        for loop in mesh.loops:
            layer.data[loop.index].uv = uvs[loop.vertex_index]

    mesh.polygons.foreach_set('use_smooth', [True] * len(mesh.polygons))
    mesh.materials.append(material)

    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    if subdiv:
        mod = obj.modifiers.new('Subdivision', 'SUBSURF')
        mod.levels = subdiv
        mod.render_levels = subdiv
    return obj


def lathe(profile, steps):
    """Spins a (radius, height) profile around the Z axis."""
    verts, faces, rings = [], [], []
    for radius, z in profile:
        if radius == 0:
            rings.append([len(verts)])
            verts.append((0.0, 0.0, z))
            continue
        ring = []
        for i in range(steps):
            a = 2 * math.pi * i / steps
            ring.append(len(verts))
            verts.append((radius * math.cos(a), radius * math.sin(a), z))
        rings.append(ring)

    for a, b in zip(rings, rings[1:]):
        for i in range(steps):
            j = (i + 1) % steps
            if len(a) == 1:
                faces.append((a[0], b[i], b[j]))
            elif len(b) == 1:
                faces.append((a[i], a[j], b[0]))
            else:
                faces.append((a[i], a[j], b[j], b[i]))
    return verts, faces


def arc_tube(center, radius, tube, start, end, arc_steps, tube_steps):
    """A tube bent along an arc in the XZ plane (used for the handle)."""
    cx, cy, cz = center
    verts, faces = [], []
    for i in range(arc_steps + 1):
        u = start + (end - start) * i / arc_steps
        nx, nz = math.cos(u), math.sin(u)
        px, pz = cx + radius * nx, cz + radius * nz
        for k in range(tube_steps):
            v = 2 * math.pi * k / tube_steps
            verts.append((px + tube * math.cos(v) * nx, cy + tube * math.sin(v), pz + tube * math.cos(v) * nz))
    for i in range(arc_steps):
        for k in range(tube_steps):
            k1 = (k + 1) % tube_steps
            a, b = i * tube_steps, (i + 1) * tube_steps
            faces.append((a + k, a + k1, b + k1, b + k))
    return verts, faces


def torus(major, minor, z, steps, tube_steps):
    verts, faces = [], []
    for i in range(steps):
        u = 2 * math.pi * i / steps
        for k in range(tube_steps):
            v = 2 * math.pi * k / tube_steps
            r = major + minor * math.cos(v)
            verts.append((r * math.cos(u), r * math.sin(u), z + minor * math.sin(v)))
    for i in range(steps):
        i1 = (i + 1) % steps
        for k in range(tube_steps):
            k1 = (k + 1) % tube_steps
            faces.append((i * tube_steps + k, i * tube_steps + k1, i1 * tube_steps + k1, i1 * tube_steps + k))
    return verts, faces


ceramic = make_material('Ceramic', '#1C1310', roughness=0.32, coat=1.0, coat_roughness=0.08)
gold = make_material('Gold', '#D9A65E', roughness=0.22, metallic=1.0)
coffee = make_material('Coffee', '#6B3D1F', roughness=0.45)

# Cup wall: outside from the foot up to the lip, then back down the inside.
CUP = [
    (0.0, -1.21), (0.6, -1.21), (0.86, -1.19), (0.97, -1.11), (1.02, -0.96),
    (1.1, -0.5), (1.18, 0.15), (1.24, 0.75), (1.27, 1.08), (1.265, 1.16),
    (1.235, 1.19), (1.2, 1.16), (1.19, 1.08),
    (1.165, 0.75), (1.1, 0.15), (1.02, -0.5), (0.94, -0.92), (0.8, -1.04), (0.0, -1.06),
]
make_object('Cup', *lathe(CUP, 64), ceramic, subdiv=1)

make_object('Rim', *torus(1.232, 0.034, 1.16, 96, 10), gold)

make_object('Handle', *arc_tube((1.12, 0.0, 0.1), 0.5, 0.12, -0.55 * math.pi, 0.55 * math.pi, 40, 16), ceramic, subdiv=1)

# Coffee surface: a flat disc with UVs so a latte-art texture can be painted on.
steps = 96
radius = 1.165
level = 0.98
disc_verts = [(0.0, 0.0, level)] + [
    (radius * math.cos(2 * math.pi * i / steps), radius * math.sin(2 * math.pi * i / steps), level) for i in range(steps)
]
disc_faces = [(0, 1 + i, 1 + (i + 1) % steps) for i in range(steps)]
disc_uvs = [((x / radius + 1) / 2, (y / radius + 1) / 2) for x, y, _ in disc_verts]
make_object('Coffee', disc_verts, disc_faces, coffee, uvs=disc_uvs)

SAUCER = [
    (0.0, -1.34), (1.5, -1.34), (1.9, -1.3), (2.12, -1.2), (2.16, -1.14), (2.1, -1.12),
    (1.9, -1.19), (1.3, -1.22), (0.0, -1.22),
]
make_object('Saucer', *lathe(SAUCER, 96), ceramic, subdiv=1)

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
)
print(f'Exported {len(scene.objects)} objects to {out_path}')
